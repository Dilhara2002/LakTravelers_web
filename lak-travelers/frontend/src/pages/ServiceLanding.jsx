import { Link } from 'react-router-dom';
import { servicePages } from '../services/servicePages';
import { whatsappUrl } from '../services/features';

export default function ServiceLanding({ path }) {
  const page = servicePages[path];
  return <article className="max-w-5xl mx-auto px-4 py-12 md:py-20 text-slate-800">
    <nav aria-label="Breadcrumb" className="text-sm text-slate-500 mb-8"><Link to="/" className="text-blue-600">Home</Link> / <span aria-current="page">{page.label}</span></nav>
    <h1 className="text-3xl md:text-5xl font-black leading-tight mb-6">{page.heading}</h1>
    <p className="text-lg leading-relaxed text-slate-600 mb-8">{page.intro}</p>
    <a href={whatsappUrl({ service: page.label })} target="_blank" rel="noopener noreferrer" className="inline-block bg-blue-600 text-white px-6 py-3 rounded-xl font-bold">Enquire on WhatsApp</a>
    <div className="my-12 space-y-8">{page.sections.map(([heading, text]) => <section key={heading} className="bg-white border border-slate-100 rounded-2xl p-6 md:p-8"><h2 className="text-2xl font-bold mb-4">{heading}</h2><p className="text-slate-600 leading-relaxed">{text}</p></section>)}</div>
    <section><h2 className="text-2xl font-bold mb-6">Frequently asked questions</h2>{page.faqs.map(([question, answer]) => <div key={question} className="mb-6"><h3 className="font-bold text-lg mb-2">{question}</h3><p className="text-slate-600 leading-relaxed">{answer}</p></div>)}</section>
    <nav aria-label="Related travel services" className="border-t pt-8 mt-10"><h2 className="text-2xl font-bold mb-4">Plan your journey</h2><ul className="flex flex-wrap gap-x-6 gap-y-3 text-blue-600 underline">{Object.entries(servicePages).filter(([route]) => route !== path).map(([route, service]) => <li key={route}><Link to={route}>{service.label}</Link></li>)}<li><Link to="/vehicles">View vehicles</Link></li><li><Link to="/reviews">Customer reviews</Link></li><li><Link to="/about">Contact our team</Link></li></ul></nav>
  </article>;
}
