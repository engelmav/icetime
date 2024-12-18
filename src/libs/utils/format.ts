import moment from 'moment';
import { IceTimeTypeEnum } from '@prisma/client';


// Format: 2021-12-31T00:00:00
export const formatDate = (date: string | Date) => {
    return moment(date).format('LLL');
};

// Format: 12/31/2021
export const formatDateShort = (date: string | Date) => {
    return moment(date).format('LL');
};

// Format: December 2021
export const formatDateShortMonth = (date: string | Date) => {
    return moment(date).format('MMMM YYYY');
};

// Format: December 31st
export const formatDateShortDay = (date: string | Date) => {
    return moment(date).format('MMMM Do');
};

// Format: 2 days ago
export const formatDateFromNow = (date: string | Date) => {
    return moment(date).fromNow();
};

// Format: December 31st 2021, 12:00:00 am
export const formatDateFull = (date: string | Date) => {
    return moment(date).format('MMMM Do YYYY, h:mm:ss a');
};


export function getReadableIceTimeType(type: IceTimeTypeEnum): string {
  const mappings: Record<IceTimeTypeEnum, string> = {
    [IceTimeTypeEnum.CLINIC]: "Clinic",
    [IceTimeTypeEnum.OPEN_SKATE]: "Open Skate",
    [IceTimeTypeEnum.STICK_TIME]: "Stick Time",
    [IceTimeTypeEnum.OPEN_HOCKEY]: "Open Hockey",
    [IceTimeTypeEnum.SUBSTITUTE_REQUEST]: "Substitute Request",
    [IceTimeTypeEnum.LEARN_TO_SKATE]: "Learn to Skate",
    [IceTimeTypeEnum.YOUTH_CLINIC]: "Youth Clinic",
    [IceTimeTypeEnum.ADULT_CLINIC]: "Adult Clinic",
    [IceTimeTypeEnum.ADULT_SKATE]: "Adult Skate",
    [IceTimeTypeEnum.OTHER]: "Other"
  };
  return mappings[type] || "Unknown";
}
