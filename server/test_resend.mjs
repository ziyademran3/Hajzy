import { Resend } from "resend";

const client = new Resend(process.env.RESEND_API_KEY);

async function main(){
  try{
    const res = await client.emails.send({
      from: process.env.RESEND_FROM || 'no-reply@example.com',
      to: process.env.TEST_TO || 'you@example.com',
      subject: 'Hajzy test email',
      html: '<p>This is a test email from Hajzy auth server.</p>'
    });
    console.log('SEND_OK', JSON.stringify(res, null, 2));
  } catch (err) {
    console.error('SEND_ERROR', err && err.response ? err.response.data || err.response : err);
    process.exit(1);
  }
}

main();
