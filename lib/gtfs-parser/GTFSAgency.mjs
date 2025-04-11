export default class GTFSAgency {

  id
  name
  website
  phone

  static UNKNOWN_AGENCY = new GTFSAgency({ id: '-1', name: 'Unknown', website: '', phone: '' })

  constructor({ id, name, website, phone }) {
    this.id = id
    this.name = name
    this.website = website
    this.phone = phone
  }

}