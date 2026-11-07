import { Link, useParams } from 'react-router-dom';
import { whatsappUrl } from '../services/features';
import toyota from '../assets/toyota-axio.jpg';
import suzuki from '../assets/suzuki-wagon-r.jpg';
import '../styles/vehicle-showcase.css';

const vehicles = [
  {
    id: 'toyota-axio-2016-hybrid',
    name: 'Toyota Axio 2016 Hybrid',
    image: toyota,
    alt: 'White Toyota Axio 2016 Hybrid'
  },
  {
    id: 'suzuki-wagon-r-stingray-2018-hybrid',
    name: 'Suzuki Wagon R Stingray 2018 Hybrid',
    image: suzuki,
    alt: 'White Suzuki Wagon R Stingray 2018 Hybrid'
  }
];

export default function PublicVehicles({
  detail = false,
  embedded = false
}) {
  const { id } = useParams();

  // Keep existing homepage vehicle cards.
  if (embedded) {
    return (
      <section className="max-w-6xl mx-auto px-4 py-16">
        <h2 className="text-4xl font-black text-slate-900">
          Our Vehicles
        </h2>
        <p className="mt-4 mb-10 text-lg text-slate-500">
          Tell us about your journey in Sri Lanka.
          Contact us for availability and a personal quote.
        </p>

        <div className="grid md:grid-cols-2 gap-8">
          {vehicles.map(vehicle => (
            <article
              key={vehicle.id}
              className="bg-white rounded-3xl overflow-hidden shadow-lg"
            >
              <Link to={`/vehicles/${vehicle.id}`}>
                <img
                  src={vehicle.image}
                  alt={vehicle.alt}
                  width="1400"
                  height="788"
                  loading="lazy"
                  decoding="async"
                  className="w-full aspect-video object-cover"
                />
              </Link>

              <div className="p-6">
                <h3 className="text-2xl font-bold">
                  {vehicle.name}
                </h3>

                <a
                  href={whatsappUrl({ vehicle: vehicle.name })}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex mt-5 min-h-11 items-center rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  Enquire
                </a>
              </div>
            </article>
          ))}
        </div>
      </section>
    );
  }

  const index = id
    ? vehicles.findIndex(vehicle => vehicle.id === id)
    : 0;

  if (index < 0 || (detail && !id)) {
    return (
      <section className="py-24 text-center">
        <h1 className="text-3xl font-bold">
          Vehicle not found
        </h1>
        <Link
          to="/vehicles"
          className="mt-5 inline-block text-blue-600 underline"
        >
          View Our Vehicles
        </Link>
      </section>
    );
  }

  const active = vehicles[index];
  const previous =
    vehicles[(index - 1 + vehicles.length) % vehicles.length];
  const next = vehicles[(index + 1) % vehicles.length];

  return (
    <section
      className="vehicle-showcase relative isolate -mx-4 md:mx-0 min-h-[calc(100svh-6rem)] overflow-hidden bg-slate-950 text-white"
      aria-label="Vehicle showcase"
    >
      {/* Soft cinematic background */}
      <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
        <img
          src={active.image}
          alt=""
          className="h-full w-full scale-110 object-cover opacity-20 blur-3xl"
        />
      </div>

      {/* Large vehicle photo */}
      <div
        key={active.id}
        className="vehicle-image-enter absolute inset-0 z-0"
      >
        <img
          src={active.image}
          alt={active.alt}
          fetchPriority="high"
          decoding="async"
          className="h-full w-full object-contain px-8 sm:px-16 lg:px-24"
        />
      </div>

      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-slate-950/80 to-transparent"
        aria-hidden="true"
      />

      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-72 bg-gradient-to-t from-slate-950 via-slate-950/85 to-transparent"
        aria-hidden="true"
      />

      {/* Header */}
      <div className="relative z-10 px-5 pt-7 text-center sm:pt-10">
        <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.3em] text-blue-300 sm:text-xs">
          Lak Travelers Collection
        </p>
        <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
          Our Vehicles
        </h1>
      </div>

      {/* Navigation arrows */}
      <Link
        to={`/vehicles/${previous.id}`}
        aria-label={`Previous vehicle: ${previous.name}`}
        className="vehicle-arrow absolute left-2 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-slate-950/60 text-white backdrop-blur-md sm:left-7 sm:h-14 sm:w-14"
      >
        <span aria-hidden="true" className="text-4xl leading-none">
          &#8249;
        </span>
      </Link>

      <Link
        to={`/vehicles/${next.id}`}
        aria-label={`Next vehicle: ${next.name}`}
        className="vehicle-arrow absolute right-2 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-slate-950/60 text-white backdrop-blur-md sm:right-7 sm:h-14 sm:w-14"
      >
        <span aria-hidden="true" className="text-4xl leading-none">
          &#8250;
        </span>
      </Link>

      {/* Vehicle details and enquiry */}
      <div className="relative z-10 flex min-h-[calc(100svh-6rem)] flex-col justify-end">
        <div
          key={`${active.id}-details`}
          className="vehicle-info-enter px-5 pb-9 pt-40 text-center sm:pb-12"
          aria-live="polite"
        >
          <p className="mb-3 text-xs font-bold tracking-[0.25em] text-slate-300">
            {String(index + 1).padStart(2, '0')}
            {' / '}
            {String(vehicles.length).padStart(2, '0')}
          </p>

          <h2 className="mx-auto max-w-3xl text-2xl font-black tracking-tight sm:text-4xl lg:text-5xl">
            {active.name}
          </h2>

          <p className="mt-3 text-sm text-slate-300 sm:text-base">
            Private Vehicle Hire in Sri Lanka
          </p>

          <a
            href={whatsappUrl({ vehicle: active.name })}
            target="_blank"
            rel="noopener noreferrer"
            className="vehicle-enquire relative mt-6 inline-flex min-h-12 items-center justify-center gap-3 overflow-hidden rounded-full bg-blue-600 px-9 py-3 text-base font-bold text-white shadow-xl shadow-blue-950/40 transition-all duration-300 hover:scale-105 hover:bg-blue-500 focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-white"
          >
            <span className="relative z-10">Enquire</span>
            <span className="relative z-10" aria-hidden="true">
              &#8599;
            </span>
          </a>
        </div>
      </div>
    </section>
  );
}
