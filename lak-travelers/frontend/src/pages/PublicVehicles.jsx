import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
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
  const navigate = useNavigate();
  const [homeIndex, setHomeIndex] = useState(0);

  const index = embedded
    ? homeIndex
    : id ? vehicles.findIndex(v => v.id === id) : 0;

  if (index < 0 || (!embedded && detail && !id)) {
    return (
      <section className="py-24 text-center">
        <h1 className="text-3xl font-bold">Vehicle not found</h1>
        <Link to="/vehicles" className="mt-5 inline-block text-blue-600 underline">
          View Our Vehicles
        </Link>
      </section>
    );
  }

  const active = vehicles[index];
  const TitleTag = embedded ? 'h2' : 'h1';
  const VehicleTag = embedded ? 'h3' : 'h2';

  const changeVehicle = direction => {
    const nextIndex =
      (index + direction + vehicles.length) % vehicles.length;

    if (embedded) {
      setHomeIndex(nextIndex);
    } else {
      navigate(`/vehicles/${vehicles[nextIndex].id}`);
    }
  };

  return (
    <section
      className={`vehicle-showcase ${
        embedded ? 'vehicle-showcase--home' : 'vehicle-showcase--page'
      } -mx-4 md:mx-0`}
      aria-label="Our vehicles"
    >
      <div className="vehicle-showcase__stage">
        <img
          key={active.id}
          className="vehicle-showcase__photo"
          src={active.image}
          alt={active.alt}
          loading={embedded ? 'lazy' : 'eager'}
          decoding="async"
        />

        <button
          type="button"
          onClick={() => changeVehicle(-1)}
          aria-label={`Show previous vehicle: ${
            vehicles[(index + vehicles.length - 1) % vehicles.length].name
          }`}
          className="vehicle-showcase__arrow vehicle-showcase__arrow--left"
        >
          <span aria-hidden="true">&#8249;</span>
        </button>

        <button
          type="button"
          onClick={() => changeVehicle(1)}
          aria-label={`Show next vehicle: ${
            vehicles[(index + 1) % vehicles.length].name
          }`}
          className="vehicle-showcase__arrow vehicle-showcase__arrow--right"
        >
          <span aria-hidden="true">&#8250;</span>
        </button>
      </div>

      <div
        key={`${active.id}-panel`}
        className="vehicle-showcase__panel"
        aria-live="polite"
      >
        <p className="vehicle-showcase__eyebrow">
          LAK TRAVELERS COLLECTION
        </p>

        <TitleTag className="vehicle-showcase__heading">
          Our Vehicles
        </TitleTag>

        <p className="vehicle-showcase__counter">
          {String(index + 1).padStart(2, '0')}
          {' / '}
          {String(vehicles.length).padStart(2, '0')}
        </p>

        <VehicleTag className="vehicle-showcase__name">
          {active.name}
        </VehicleTag>

        <p className="vehicle-showcase__description">
          Private Vehicle Hire in Sri Lanka
        </p>

        <a
          href={whatsappUrl({ vehicle: active.name })}
          target="_blank"
          rel="noopener noreferrer"
          className="vehicle-showcase__enquire"
        >
          Enquire
          <span aria-hidden="true">&#8599;</span>
        </a>
      </div>
    </section>
  );
}
