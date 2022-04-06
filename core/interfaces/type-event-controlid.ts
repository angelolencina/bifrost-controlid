
export enum TypeEventControlid {
  Pass = 7
}


export const eventTypeIdToText = (typeId:number) => {
  switch (typeId) {
    case TypeEventControlid.Pass:
      return 'pass'
    default:
      return 'generic'
  }
}

export enum StatusCard {

}
