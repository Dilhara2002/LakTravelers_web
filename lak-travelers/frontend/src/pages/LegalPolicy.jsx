import { Link } from 'react-router-dom';

export default function LegalPolicy({ terms = false }) {
  const sections = terms ? [
    ['Enquiries and confirmation', 'Lak Travelers is a Sri Lankan travel and vehicle enquiry service under IDW (Pvt) Ltd. Sending an enquiry does not confirm a booking. Confirm vehicle availability, itinerary, price, payment arrangements and any cancellation conditions with our team before committing.'],
    ['Using this website', 'Provide accurate information and use the service lawfully. Do not upload harmful files, impersonate others or attempt to access another person’s account. Keep your account credentials private.'],
    ['Reviews and photos', 'Submit genuine experiences and only photos you have permission to share. Avoid private contact details or images of others without their permission. Submissions are moderated before public display and may be declined.'],
    ['Service information', 'Listings and photos help you make an enquiry. Availability and arrangements may change; confirm current details with us. WhatsApp and other external services operate under their own terms and privacy policies.'],
    ['Questions', 'Contact us before booking if you have questions about arrangements, cancellations or these terms.'],
  ] : [
    ['Information you provide', 'Lak Travelers, a brand of IDW (Pvt) Ltd, processes account details such as name, email and a password hash; booking or enquiry details; and reviews, ratings and uploaded photos. Information you send on WhatsApp is handled through that service as well as by our team.'],
    ['How information is used', 'We use this information to respond to enquiries, manage accounts and bookings, moderate submissions and operate the website. Approved reviews display your submitted name, rating, review text and photos publicly. Pending reviews and private drafts are restricted to administrators.'],
    ['Storage and service providers', 'Reviews and gallery photos are stored in MongoDB. Website hosting, API hosting, email delivery and optional sign-in providers process information needed to provide their services. Admin review notifications may include submitted review details. Authentication uses a session cookie and browser storage.'],
    ['Security and retention', 'We use access controls, password hashing and HTTPS on the deployed service. No system can guarantee absolute security. Information remains stored until removed through applicable administration processes; the website does not currently apply an automatic retention period. Backups may retain earlier copies.'],
    ['Your choices', 'WhatsApp enquiries do not require a website account. Avoid submitting sensitive information or photos you lack permission to share. Contact us to request access, correction or removal of your information or published content; we may need to verify your identity and review any outstanding booking obligations.'],
  ];
  return <section className="mx-auto max-w-4xl px-4 py-12 md:py-20">
    <h1 className="text-4xl md:text-5xl font-black mb-8">{terms ? 'Terms of Use' : 'Privacy Policy'}</h1>
    <div className="space-y-6">{sections.map(([title, text]) => <section key={title} className="rounded-2xl bg-white border p-6 md:p-8"><h2 className="text-xl font-bold mb-3">{title}</h2><p className="text-slate-600 leading-relaxed">{text}</p></section>)}</div>
    <p className="mt-8">Questions or requests? <Link to="/contact" className="text-blue-700 underline">Contact Lak Travelers</Link>.</p>
  </section>;
}
