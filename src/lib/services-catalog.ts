export type {
  ServiceActionType,
  ServiceIconKey,
  ServiceItem,
  SerializableService,
  StoredService,
} from "@/lib/service-storage";
export {
  getDefaultServices,
  getServiceIcon,
  serializableToServiceItem,
  storedServiceToItem,
  storedServiceToSerializable,
} from "@/lib/service-storage";

import { getDefaultServices, storedServiceToItem } from "@/lib/service-storage";

/** Static defaults — prefer `getPublicServices()` for live data. */
export const servicesCatalog = getDefaultServices().map(storedServiceToItem);
