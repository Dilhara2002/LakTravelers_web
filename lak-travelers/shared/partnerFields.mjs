// Shared form contract; the API independently validates every supplied value.
const field = (key, label, type = 'text', options) => ({ key, label, type, ...(options ? { options } : {}) });
const common = [field('name', 'Full name / business name'), field('email', 'Contact email', 'email'), field('whatsapp', 'WhatsApp number', 'tel'), field('nic', 'NIC number'), field('address', 'Address'), field('district', 'District')];
export const partnerCategories = {
  guide: {
    label: 'Tourist Guide', requirement: 'Valid SLTDA Tourist Guide Licence Required.',
    fields: [...common, field('guideCategory', 'Guide category', 'select', ['National', 'Chauffeur', 'Area', 'Site']), field('licenceNumber', 'SLTDA licence number'), field('licenceIssued', 'Licence issue date', 'date'), field('licenceExpiry', 'Licence expiry date', 'date'), field('languages', 'Languages (comma separated)'), field('locations', 'Guiding locations'), field('experience', 'Years of experience', 'number'), field('biography', 'Biography', 'textarea')],
    documents: ['profilePhoto', 'nicFront', 'nicBack', 'guideLicenceFront', 'guideLicenceBack'],
  },
  driver: {
    label: 'Tourist Driver', requirement: 'Valid Tourist Driver ID and Driving Licence Required.',
    fields: [...common, field('touristDriverId', 'Tourist driver ID'), field('touristIdExpiry', 'Tourist driver ID expiry date', 'date'), field('drivingLicence', 'Driving licence number'), field('drivingLicenceExpiry', 'Driving licence expiry date', 'date'), field('experience', 'Years of experience', 'number'), field('vehicleClasses', 'Permitted vehicle classes'), field('locations', 'Preferred service locations')],
    documents: ['profilePhoto', 'nicFront', 'nicBack', 'touristIdFront', 'touristIdBack', 'drivingLicenceFront', 'drivingLicenceBack'],
  },
  vehicle: {
    label: 'Vehicle Owner', requirement: 'Valid registration certificate, revenue licence and insurance required. Registration does not authorize self-drive rentals.',
    fields: [...common, field('vehicleType', 'Vehicle type', 'select', ['Car', 'Van', 'SUV', 'Bus', 'Other']), field('brand', 'Brand'), field('model', 'Model'), field('year', 'Year', 'number'), field('registrationNumber', 'Vehicle registration number'), field('seats', 'Seating capacity', 'number'), field('ac', 'Air conditioning', 'select', ['Yes', 'No']), field('locations', 'Service locations'), field('rentalBasis', 'Rental basis', 'select', ['With driver', 'Self-drive requested — separate authorization required']), field('description', 'Vehicle description', 'textarea'), field('revenueExpiry', 'Revenue licence expiry date', 'date'), field('insuranceExpiry', 'Insurance expiry date', 'date')],
    documents: ['exteriorPhoto', 'interiorPhoto', 'registrationCertificate', 'revenueLicence', 'insurance'],
  },
};
export const statuses = ['Draft', 'Submitted', 'Under Review', 'Changes Requested', 'Approved', 'Rejected', 'Suspended'];
export const editableStatuses = ['Draft', 'Changes Requested'];
export const documentLabel = key => key.replace(/([A-Z])/g, ' $1').replace(/^./, x => x.toUpperCase()).replace(/^Nic /, 'NIC ');
export const isPhoto = key => key.endsWith('Photo');
export const MAX_FILE_SIZE = 5 * 1024 * 1024;
