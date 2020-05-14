import { DataTypeUUIDv1 } from "sequelize";

export interface Entity {
  entitytypeguid: string;
  name: string;
  locationid: string;
  statusid: string;
  pdu: string;
  member: string;
  radmin: string;
  vnc: string;
  rdp: string;
  ssh: string;
  assetid: number;
  virtualhost: string;
  datecreated?: Date;
  datemodified?: Date;
  datedeleted?: Date;
  guid: DataTypeUUIDv1;
  entitytypeid: number;
  isfavourite:boolean
}

export interface EntityEncryptDecrypt {
  ipvalue: string;
  domainvalue: string;
  usernamevalue: string;
  passwordvalue: string;
  urlvalue: string;
  comment: string;
  portvalue: string;
  internalip1: string;
  internalip2: string;
  externalip1: string;
  externalip2: string;
  wanip1: string;
  wanip2: string;
  backuplocation: string;
  dtinstallation: string;
  localusers: string;
  cpu: string;
  mainboard: string;
  ram: string;
  harddrive: string;
  housing: string;
  brand: string;
  pduport: string;
  sqlsrvversion: string;
  liveapp: string;
  testapp: string;
  livedb: string;
  testdb: string;
}
