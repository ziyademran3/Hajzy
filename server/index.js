import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { Pool } from 'pg'
import crypto from 'crypto'
import { Resend } from 'resend'

const app = express()
const port = Number(process.env.PORT || 4000)
const jwtSecret = process.env.JWT_SECRET || 'dev-secret-change-me'
const appUrl = process.env.APP_URL || 'http://localhost:5173'
const emailFrom = process.env.RESEND_FROM || 'no-reply@localhost'
const allowUnverifiedLogin = process.env.ALLOW_UNVERIFIED_LOGIN === 'true'

app.use(helmet())
app.use(cors({ origin: true, credentials: true }))
app.use(express.json())

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 80,
  standardHeaders: true,
  legacyHeaders: false,
})
app.use('/api/auth', authLimiter)

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null
let pgPool = null
let usingMemoryStore = true

const memoryUsers = new Map()
let nextUserId = 1

// In-memory storage for properties and bookings (dev fallback)
const memoryProperties = new Map()
let nextPropertyId = 1

const memoryBookings = new Map()
let nextBookingId = 1

const normalizeMemoryUser = (user) => {
  if (!user) return null

  return {
    ...user,
    fullName: user.full_name || user.fullName,
    passwordHash: user.password_hash || user.passwordHash,
    emailVerified: user.email_verified ?? user.emailVerified ?? false,
    verificationToken: user.verification_token ?? user.verificationToken ?? null,
    resetToken: user.reset_token ?? user.resetToken ?? null,
    resetTokenExpiresAt: user.reset_token_expires_at ?? user.resetTokenExpiresAt ?? null,
  }
}

const getMemoryUserByEmail = (email) => {
  const normalizedEmail = email.trim().toLowerCase()
  for (const user of memoryUsers.values()) {
    const normalized = normalizeMemoryUser(user)
    if (normalized.email === normalizedEmail) {
      return normalized
    }
  }
  return null
}

const getMemoryUserByResetToken = (token) => {
  for (const user of memoryUsers.values()) {
    const normalized = normalizeMemoryUser(user)
    if (normalized.resetToken === token && normalized.resetTokenExpiresAt && new Date(normalized.resetTokenExpiresAt) > new Date()) {
      return normalized
    }
  }
  return null
}

const getMemoryUserByVerificationToken = (token) => {
  for (const user of memoryUsers.values()) {
    const normalized = normalizeMemoryUser(user)
    if (normalized.verificationToken === token) {
      return normalized
    }
  }
  return null
}

const db = {
  async getUserByEmail(email) {
    if (pgPool) {
      const result = await pgPool.query('SELECT * FROM users WHERE email = $1', [email])
      return result.rows[0] || null
    }
    return getMemoryUserByEmail(email)
  },

  async getUserByResetToken(token) {
    if (pgPool) {
      const result = await pgPool.query(
        'SELECT * FROM users WHERE reset_token = $1 AND reset_token_expires_at > NOW()',
        [token]
      )
      return result.rows[0] || null
    }
    return getMemoryUserByResetToken(token)
  },

  async getUserByVerificationToken(token) {
    if (pgPool) {
      const result = await pgPool.query('SELECT * FROM users WHERE verification_token = $1', [token])
      return result.rows[0] || null
    }
    return getMemoryUserByVerificationToken(token)
  },

  async createUser(payload) {
    if (pgPool) {
      const result = await pgPool.query(
        `INSERT INTO users (full_name, email, password_hash, verification_token, email_verified, reset_token, reset_token_expires_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [payload.fullName, payload.email, payload.passwordHash, payload.verificationToken, payload.emailVerified, payload.resetToken ?? null, payload.resetTokenExpiresAt ?? null]
      )
      return result.rows[0]
    }

    const user = {
      id: nextUserId++,
      full_name: payload.fullName,
      fullName: payload.fullName,
      email: payload.email,
      password_hash: payload.passwordHash,
      passwordHash: payload.passwordHash,
      email_verified: payload.emailVerified,
      emailVerified: payload.emailVerified,
      verification_token: payload.verificationToken || null,
      verificationToken: payload.verificationToken || null,
      reset_token: payload.resetToken || null,
      resetToken: payload.resetToken || null,
      reset_token_expires_at: payload.resetTokenExpiresAt || null,
      resetTokenExpiresAt: payload.resetTokenExpiresAt || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    memoryUsers.set(user.id, user)
    return normalizeMemoryUser(user)
  },

  async updateUserById(id, updates) {
    if (pgPool) {
      const fields = []
      const values = []
      let index = 1

      Object.entries(updates).forEach(([key, value]) => {
        fields.push(`${key} = $${index}`)
        values.push(value)
        index += 1
      })

      values.push(id)
      const result = await pgPool.query(`UPDATE users SET ${fields.join(', ')} WHERE id = $${index} RETURNING *`, values)
      return result.rows[0] || null
    }

    const user = memoryUsers.get(Number(id))
    if (!user) return null

    const nextUser = {
      ...user,
      ...updates,
      full_name: updates.full_name ?? user.full_name ?? user.fullName,
      fullName: updates.fullName ?? user.fullName ?? user.full_name,
      password_hash: updates.password_hash ?? user.password_hash ?? user.passwordHash,
      passwordHash: updates.passwordHash ?? user.passwordHash ?? user.password_hash,
      email_verified: updates.email_verified ?? user.email_verified ?? user.emailVerified ?? false,
      emailVerified: updates.emailVerified ?? user.emailVerified ?? user.email_verified ?? false,
      verification_token: updates.verification_token ?? user.verification_token ?? user.verificationToken ?? null,
      verificationToken: updates.verificationToken ?? user.verificationToken ?? user.verification_token ?? null,
      reset_token: updates.reset_token ?? user.reset_token ?? user.resetToken ?? null,
      resetToken: updates.resetToken ?? user.resetToken ?? user.reset_token ?? null,
      reset_token_expires_at: updates.reset_token_expires_at ?? user.reset_token_expires_at ?? user.resetTokenExpiresAt ?? null,
      resetTokenExpiresAt: updates.resetTokenExpiresAt ?? user.resetTokenExpiresAt ?? user.reset_token_expires_at ?? null,
      updated_at: new Date().toISOString(),
    }

    memoryUsers.set(user.id, nextUser)
    return normalizeMemoryUser(nextUser)
  },

  // Properties and bookings
  async getProperties() {
    if (pgPool) {
      const result = await pgPool.query('SELECT * FROM properties ORDER BY id DESC')
      return result.rows
    }
    return Array.from(memoryProperties.values())
  },

  async getPropertyById(id) {
    if (pgPool) {
      const result = await pgPool.query('SELECT * FROM properties WHERE id = $1', [id])
      if (!result.rows[0]) return null
      const images = await pgPool.query('SELECT * FROM property_images WHERE property_id = $1 ORDER BY "order" ASC', [id])
      return { ...result.rows[0], images: images.rows }
    }
    const p = memoryProperties.get(Number(id))
    if (!p) return null
    const images = Array.from(p.images || [])
    return { ...p, images }
  },

  async createProperty(payload) {
    if (pgPool) {
      const result = await pgPool.query(
        `INSERT INTO properties (owner_id, title, description, price_per_night, currency, address)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [payload.owner_id, payload.title, payload.description || null, payload.price_per_night || 0, payload.currency || 'USD', payload.address || null]
      )
      const property = result.rows[0]
      if (payload.images && Array.isArray(payload.images) && payload.images.length > 0) {
        const vals = []
        const inserts = payload.images.map((url, idx) => {
          vals.push(property.id, url, idx)
          return `INSERT INTO property_images (property_id, url, "order") VALUES ($${vals.length-2}, $${vals.length-1}, $${vals.length})`
        })
        for (const q of inserts) await pgPool.query(q, vals.splice(0, 3))
      }
      return property
    }

    const id = nextPropertyId++
    const property = { id, owner_id: payload.owner_id, title: payload.title, description: payload.description || '', price_per_night: payload.price_per_night || 0, currency: payload.currency || 'USD', address: payload.address || null, images: payload.images || [] }
    memoryProperties.set(id, property)
    return property
  },

  async createBooking({ propertyId, userId, startDate, endDate, totalPrice, paymentIntentId = null }) {
    if (pgPool) {
      const client = await pgPool.connect()
      try {
        await client.query('BEGIN')
        const insertText = `INSERT INTO bookings (property_id, user_id, start_date, end_date, status, total_price, payment_intent_id)
          VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`
        const values = [propertyId, userId, startDate, endDate, 'pending', totalPrice || 0, paymentIntentId]
        const result = await client.query(insertText, values)
        await client.query('COMMIT')
        return result.rows[0]
      } catch (err) {
        await client.query('ROLLBACK')
        // Postgres exclusion constraint violation code
        if (err && err.code === '23P01') {
          const e = new Error('Booking conflict: dates not available')
          e.code = 'BOOKING_CONFLICT'
          throw e
        }
        throw err
      } finally {
        client.release()
      }
    }

    // In-memory check for overlapping bookings
    const start = new Date(startDate)
    const end = new Date(endDate)
    for (const b of memoryBookings.values()) {
      if (Number(b.property_id) !== Number(propertyId)) continue
      if (['pending','confirmed','paid'].includes(b.status)) {
        const bs = new Date(b.start_date)
        const be = new Date(b.end_date)
        // check overlap
        if (start < be && end > bs) {
          const e = new Error('Booking conflict: dates not available')
          e.code = 'BOOKING_CONFLICT'
          throw e
        }
      }
    }

    const id = nextBookingId++
    const booking = { id, property_id: Number(propertyId), user_id: Number(userId), start_date: start.toISOString(), end_date: end.toISOString(), status: 'pending', total_price: totalPrice || 0, payment_intent_id: paymentIntentId, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
    memoryBookings.set(id, booking)
    return booking
  },

  async getBookingsForUser(userId) {
    if (pgPool) {
      const result = await pgPool.query('SELECT * FROM bookings WHERE user_id = $1 ORDER BY created_at DESC', [userId])
      return result.rows
    }
    return Array.from(memoryBookings.values()).filter((b) => Number(b.user_id) === Number(userId)).sort((a,b)=> new Date(b.created_at)-new Date(a.created_at))
  },

  async getBookingById(id) {
    if (pgPool) {
      const result = await pgPool.query('SELECT * FROM bookings WHERE id = $1', [id])
      return result.rows[0] || null
    }
    return memoryBookings.get(Number(id)) || null
  },
}


async function ensurePostgresConnection() {
  if (!process.env.DATABASE_URL) {
    console.log('No DATABASE_URL configured. Using in-memory auth store for local dev.')
    return
  }

  try {
    pgPool = new Pool({ connectionString: process.env.DATABASE_URL })
    await pgPool.query('SELECT 1')
    usingMemoryStore = false
    console.log('PostgreSQL connection established.')
  } catch {
    console.warn('PostgreSQL is unavailable. Falling back to the in-memory auth store.')
    pgPool = null
    usingMemoryStore = true
  }
}

async function initializeDatabase() {
  if (!pgPool) return

  await pgPool.query(`
    -- users table
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      full_name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      email_verified BOOLEAN NOT NULL DEFAULT FALSE,
      verification_token TEXT,
      reset_token TEXT,
      reset_token_expires_at TIMESTAMPTZ,
      avatar_url TEXT,
      role TEXT DEFAULT 'user',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);

    -- properties (listings)
    CREATE TABLE IF NOT EXISTS properties (
      id SERIAL PRIMARY KEY,
      owner_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      description TEXT,
      price_per_night NUMERIC(10,2) NOT NULL DEFAULT 0,
      currency TEXT NOT NULL DEFAULT 'USD',
      address TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_properties_owner ON properties (owner_id);

    CREATE TABLE IF NOT EXISTS property_images (
      id SERIAL PRIMARY KEY,
      property_id INTEGER REFERENCES properties(id) ON DELETE CASCADE,
      url TEXT NOT NULL,
      "order" INTEGER NOT NULL DEFAULT 0
    );

    CREATE INDEX IF NOT EXISTS idx_property_images_property ON property_images (property_id);

    -- bookings with range and exclusion constraint to prevent overlapping bookings for same property
    CREATE EXTENSION IF NOT EXISTS btree_gist;

    CREATE TABLE IF NOT EXISTS bookings (
      id SERIAL PRIMARY KEY,
      property_id INTEGER REFERENCES properties(id) ON DELETE CASCADE,
      user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      start_date TIMESTAMPTZ NOT NULL,
      end_date TIMESTAMPTZ NOT NULL,
      period tstzrange GENERATED ALWAYS AS (tstzrange(start_date, end_date, '[)')) STORED,
      status TEXT NOT NULL DEFAULT 'pending',
      total_price NUMERIC(10,2) NOT NULL DEFAULT 0,
      payment_intent_id TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_bookings_property_period ON bookings USING GIST (property_id, period);

    -- exclude overlapping bookings for active statuses
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'no_overlapping_bookings'
      ) THEN
        ALTER TABLE bookings ADD CONSTRAINT no_overlapping_bookings EXCLUDE USING gist (
          property_id WITH =,
          period WITH &&
        ) WHERE (status IN ('pending','confirmed','paid'));
      END IF;
    END$$;
  `)
}

async function sendEmail({ to, subject, html }) {
  if (!resend) {
    return {
      ok: false,
      message: 'Email service is not configured. Set RESEND_API_KEY and RESEND_FROM.',
    }
  }

  try {
    const { data, error } = await resend.emails.send({
      from: emailFrom,
      to,
      subject,
      html,
    })

    if (error) {
      console.error('Resend error:', error)
      return { ok: false, message: error.message || 'Failed to send email.' }
    }

    return { ok: true, result: data }
  } catch (error) {
    console.error('Resend error:', error)
    return { ok: false, message: error.message || 'Failed to send email.' }
  }
}

function buildAuthToken(user) {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      fullName: user.full_name || user.fullName,
    },
    jwtSecret,
    { expiresIn: '7d' }
  )
}

app.get('/api/health', async (_req, res) => {
  res.json({
    ok: true,
    mode: usingMemoryStore ? 'memory' : 'postgres',
    emailConfigured: Boolean(resend),
    message: usingMemoryStore ? 'API is healthy (local memory store).' : 'API is healthy (PostgreSQL).',
  })
})

app.post('/api/auth/register', async (req, res) => {
  try {
    const { fullName, email, password } = req.body || {}

    if (!fullName || !email || !password) {
      return res.status(400).json({ message: 'fullName, email and password are required.' })
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ message: 'Please provide a valid email address.' })
    }

    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters long.' })
    }

    const normalizedEmail = email.trim().toLowerCase()
    const existingUser = await db.getUserByEmail(normalizedEmail)
    if (existingUser) {
      return res.status(409).json({ message: 'An account with this email already exists.' })
    }

    const passwordHash = await bcrypt.hash(password, 12)
    const verificationToken = crypto.randomBytes(32).toString('hex')
    const user = await db.createUser({
      fullName: fullName.trim(),
      email: normalizedEmail,
      passwordHash,
      emailVerified: false,
      verificationToken,
    })

    const verificationLink = `${appUrl}/verify-email?token=${verificationToken}`
    const emailResult = await sendEmail({
      to: normalizedEmail,
      subject: 'Verify your Hajzy account',
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #0f172a;">
          <h2>Hello ${fullName.trim()},</h2>
          <p>Thanks for creating your account.</p>
          <p>Click the link below to verify your email:</p>
          <p><a href="${verificationLink}">${verificationLink}</a></p>
        </div>
      `,
    })

    if (!emailResult.ok) {
      return res.status(201).json({
        message: 'User created successfully, but the verification email could not be sent right now.',
        verificationToken,
        user: {
          id: user.id,
          fullName: user.full_name || user.fullName,
          email: user.email,
          emailVerified: user.email_verified ?? false,
        },
      })
    }

    return res.status(201).json({
      message: 'User registered successfully. Please verify your email address.',
      verificationToken,
      user: {
        id: user.id,
        fullName: user.full_name || user.fullName,
        email: user.email,
        emailVerified: user.email_verified ?? false,
      },
    })
  } catch (error) {
    console.error('register error:', error)
    res.status(500).json({ message: 'Unable to register user right now.', error: error.message })
  }
})

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body || {}

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' })
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ message: 'Please provide a valid email address.' })
    }

    const normalizedEmail = email.trim().toLowerCase()
    const user = await db.getUserByEmail(normalizedEmail)
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' })
    }

    const passwordHash = user.password_hash || user.passwordHash
    const isValidPassword = await bcrypt.compare(password, passwordHash)
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid email or password.' })
    }

    if (!user.email_verified && !user.emailVerified && !allowUnverifiedLogin) {
      return res.status(403).json({ message: 'Please verify your email before logging in.' })
    }

    const token = buildAuthToken(user)
    return res.status(200).json({
      message: 'Login successful.',
      token,
      user: {
        id: user.id,
        fullName: user.full_name || user.fullName,
        email: user.email,
        emailVerified: user.email_verified ?? user.emailVerified ?? false,
      },
    })
  } catch (error) {
    console.error('login error:', error)
    res.status(500).json({ message: 'Unable to log in right now.', error: error.message })
  }
})

// Authentication middleware for protected endpoints
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization || req.headers.Authorization
  if (!authHeader) return res.status(401).json({ message: 'Authorization header required.' })
  const parts = String(authHeader).split(' ')
  const token = parts.length === 2 ? parts[1] : parts[0]
  try {
    const payload = jwt.verify(token, jwtSecret)
    req.auth = payload
    return next()
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token.' })
  }
}

// Get current user profile
app.get('/api/auth/me', authenticate, async (req, res) => {
  try {
    const userId = req.auth?.userId
    if (!userId) return res.status(400).json({ message: 'Invalid token payload.' })

    let user = null
    if (pgPool) {
      const result = await pgPool.query('SELECT * FROM users WHERE id = $1', [userId])
      user = result.rows[0] || null
    } else {
      const mem = memoryUsers.get(Number(userId))
      user = normalizeMemoryUser(mem)
    }

    if (!user) return res.status(404).json({ message: 'User not found.' })

    return res.json({ user: {
      id: user.id,
      fullName: user.full_name || user.fullName,
      email: user.email,
      emailVerified: user.email_verified ?? user.emailVerified ?? false,
      role: user.role || 'user',
      created_at: user.created_at || user.createdAt,
    }})
  } catch (error) {
    console.error('me error:', error)
    return res.status(500).json({ message: 'Unable to fetch profile right now.' })
  }
})

// Update current user profile
app.patch('/api/auth/me', authenticate, async (req, res) => {
  try {
    const userId = req.auth?.userId
    if (!userId) return res.status(400).json({ message: 'Invalid token payload.' })

    const { fullName, email, avatar_url } = req.body || {}
    const updates = {}

    if (fullName) updates.full_name = String(fullName).trim()
    if (avatar_url) updates.avatar_url = String(avatar_url).trim()

    if (email) {
      if (!isValidEmail(email)) return res.status(400).json({ message: 'Please provide a valid email address.' })
      const normalized = String(email).trim().toLowerCase()
      const existing = await db.getUserByEmail(normalized)
      if (existing && String(existing.id) !== String(userId)) {
        return res.status(409).json({ message: 'Another account with this email already exists.' })
      }
      updates.email = normalized
    }

    const updated = await db.updateUserById(userId, updates)
    if (!updated) return res.status(404).json({ message: 'User not found.' })

    return res.json({ message: 'Profile updated successfully.', user: {
      id: updated.id,
      fullName: updated.full_name || updated.fullName,
      email: updated.email,
      emailVerified: updated.email_verified ?? updated.emailVerified ?? false,
      avatar_url: updated.avatar_url || updated.avatarUrl || null,
    }})
  } catch (error) {
    console.error('update profile error:', error)
    return res.status(500).json({ message: 'Unable to update profile right now.' })
  }
})

app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body || {}

    if (!email || !isValidEmail(email)) {
      return res.status(400).json({ message: 'Please provide a valid email address.' })
    }

    const normalizedEmail = email.trim().toLowerCase()
    const user = await db.getUserByEmail(normalizedEmail)
    if (!user) {
      return res.status(404).json({ message: 'No account was found for this email address.' })
    }

    const resetToken = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000)

    await db.updateUserById(user.id, {
      reset_token: resetToken,
      reset_token_expires_at: expiresAt.toISOString(),
    })

    const resetLink = `${appUrl}/reset-password?token=${resetToken}`
    const emailResult = await sendEmail({
      to: normalizedEmail,
      subject: 'Reset your Hajzy password',
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #0f172a;">
          <h2>Password reset request</h2>
          <p>Click the link below to reset your password.</p>
          <p><a href="${resetLink}">${resetLink}</a></p>
          <p>This link will expire in 30 minutes.</p>
        </div>
      `,
    })

    if (!emailResult.ok) {
      return res.status(200).json({
        message: 'Password reset link could not be sent right now. Please configure the email provider.',
        resetToken,
      })
    }

    return res.status(200).json({ message: 'Password reset instructions have been sent to your email.', resetToken })
  } catch (error) {
    console.error('forgot password error:', error)
    res.status(500).json({ message: 'Unable to process password reset right now.', error: error.message })
  }
})

app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body || {}

    if (!token || !newPassword) {
      return res.status(400).json({ message: 'Token and new password are required.' })
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'New password must be at least 8 characters long.' })
    }

    const user = await db.getUserByResetToken(token)
    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired password reset token.' })
    }

    const passwordHash = await bcrypt.hash(newPassword, 12)
    await db.updateUserById(user.id, {
      password_hash: passwordHash,
      reset_token: null,
      reset_token_expires_at: null,
    })

    return res.status(200).json({ message: 'Password reset successfully.' })
  } catch (error) {
    console.error('reset password error:', error)
    res.status(500).json({ message: 'Unable to reset password right now.', error: error.message })
  }
})

app.post('/api/auth/verify-email', async (req, res) => {
  try {
    const { token } = req.body || {}

    if (!token) {
      return res.status(400).json({ message: 'Verification token is required.' })
    }

    const user = await db.getUserByVerificationToken(token)
    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired verification token.' })
    }

    await db.updateUserById(user.id, {
      email_verified: true,
      verification_token: null,
    })

    return res.status(200).json({ message: 'Email verified successfully.' })
  } catch (error) {
    console.error('verify email error:', error)
    res.status(500).json({ message: 'Unable to verify email right now.', error: error.message })
  }
})

// Change password
app.post('/api/auth/change-password', authenticate, async (req, res) => {
  try {
    const userId = req.auth?.userId
    if (!userId) return res.status(400).json({ message: 'Invalid token payload.' })

    const { currentPassword, newPassword } = req.body || {}
    if (!currentPassword || !newPassword) return res.status(400).json({ message: 'currentPassword and newPassword are required.' })
    if (newPassword.length < 8) return res.status(400).json({ message: 'New password must be at least 8 characters long.' })

    // fetch user
    let user = null
    if (pgPool) {
      const result = await pgPool.query('SELECT * FROM users WHERE id = $1', [userId])
      user = result.rows[0] || null
    } else {
      const mem = memoryUsers.get(Number(userId))
      user = normalizeMemoryUser(mem)
    }

    if (!user) return res.status(404).json({ message: 'User not found.' })

    const isValid = await bcrypt.compare(currentPassword, user.password_hash || user.passwordHash)
    if (!isValid) return res.status(401).json({ message: 'Current password is incorrect.' })

    const hashed = await bcrypt.hash(newPassword, 12)
    await db.updateUserById(userId, { password_hash: hashed })

    return res.json({ message: 'Password updated successfully.' })
  } catch (error) {
    console.error('change password error:', error)
    return res.status(500).json({ message: 'Unable to change password right now.' })
  }
})

// Properties endpoints
app.get('/api/properties', async (req, res) => {
  try {
    const properties = await db.getProperties()
    return res.json({ properties })
  } catch (err) {
    console.error('get properties error:', err)
    return res.status(500).json({ message: 'Unable to fetch properties.' })
  }
})

app.get('/api/properties/:id', async (req, res) => {
  try {
    const { id } = req.params
    const prop = await db.getPropertyById(id)
    if (!prop) return res.status(404).json({ message: 'Property not found.' })
    return res.json({ property: prop })
  } catch (err) {
    console.error('get property error:', err)
    return res.status(500).json({ message: 'Unable to fetch property.' })
  }
})

app.post('/api/properties', authenticate, async (req, res) => {
  try {
    const ownerId = req.auth?.userId
    const { title, description, price_per_night, currency, address, images } = req.body || {}
    if (!title || !price_per_night) return res.status(400).json({ message: 'title and price_per_night are required.' })
    const prop = await db.createProperty({ owner_id: ownerId, title, description, price_per_night, currency, address, images })
    return res.status(201).json({ property: prop })
  } catch (err) {
    console.error('create property error:', err)
    return res.status(500).json({ message: 'Unable to create property.' })
  }
})

// Bookings endpoints
app.post('/api/bookings', authenticate, async (req, res) => {
  try {
    const userId = req.auth?.userId
    const { propertyId, startDate, endDate } = req.body || {}
    if (!propertyId || !startDate || !endDate) return res.status(400).json({ message: 'propertyId, startDate and endDate are required.' })

    // fetch property to calculate price
    const property = await db.getPropertyById(propertyId)
    if (!property) return res.status(404).json({ message: 'Property not found.' })

    const start = new Date(startDate)
    const end = new Date(endDate)
    if (!(start instanceof Date) || isNaN(start) || !(end instanceof Date) || isNaN(end) || end <= start) {
      return res.status(400).json({ message: 'Invalid startDate or endDate.' })
    }

    const msPerDay = 1000 * 60 * 60 * 24
    const nights = Math.ceil((end - start) / msPerDay)
    const pricePerNight = Number(property.price_per_night || property.pricePerNight || property.priceValue || 0)
    const total = Math.max(0, nights * pricePerNight)

    try {
      const booking = await db.createBooking({ propertyId, userId, startDate: start.toISOString(), endDate: end.toISOString(), totalPrice: total })
      return res.status(201).json({ booking })
    } catch (err) {
      if (err && err.code === 'BOOKING_CONFLICT') {
        return res.status(409).json({ message: 'Dates not available for booking.' })
      }
      throw err
    }
  } catch (err) {
    console.error('create booking error:', err)
    return res.status(500).json({ message: 'Unable to create booking.' })
  }
})

app.get('/api/users/me/bookings', authenticate, async (req, res) => {
  try {
    const userId = req.auth?.userId
    const bookings = await db.getBookingsForUser(userId)
    return res.json({ bookings })
  } catch (err) {
    console.error('get user bookings error:', err)
    return res.status(500).json({ message: 'Unable to fetch bookings.' })
  }
})

app.get('/api/bookings/:id', authenticate, async (req, res) => {
  try {
    const userId = req.auth?.userId
    const { id } = req.params
    const booking = await db.getBookingById(id)
    if (!booking) return res.status(404).json({ message: 'Booking not found.' })

    // allow owner or property owner
    let property = null
    if (booking.property_id) property = await db.getPropertyById(booking.property_id)

    const isOwner = String(booking.user_id) === String(userId)
    const isPropertyOwner = property && String(property.owner_id) === String(userId)
    if (!isOwner && !isPropertyOwner) return res.status(403).json({ message: 'Forbidden' })

    return res.json({ booking })
  } catch (err) {
    console.error('get booking error:', err)
    return res.status(500).json({ message: 'Unable to fetch booking.' })
  }
})

await ensurePostgresConnection()
await initializeDatabase()
app.listen(port, () => {
  console.log(`Hajzy auth server running on http://localhost:${port} (${usingMemoryStore ? 'memory store' : 'postgres'})`)
})
