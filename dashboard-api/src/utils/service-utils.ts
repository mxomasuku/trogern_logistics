const { db } = require('../config/firebase');
const incomeRef = db.collection('income');
const vehiclesRef = db.collection('vehicles');

async function getDriverDetailsForVehicle(vehicleId: string): Promise<{
  driverId: string;
  driverName: string;
}> {
  try {
    const vSnap = await vehiclesRef.doc(String(vehicleId)).get();
    if (!vSnap.exists) {
      return { driverId: '', driverName: '' };
    }

    const v = vSnap.data() || {};

    // Determine "active" status using common patterns
    const rawStatus = v.active ?? v.isActive ?? v.status;
    const inactiveLabels = new Set(['inactive', 'retired', 'maintenance']);
    const activeLabel = "active"

    // Default to false (pessimistic)
    let isActive = false;

    if (typeof rawStatus === 'boolean') {
      isActive = rawStatus;
    } else if (typeof rawStatus === 'string') {
      const s = rawStatus.toLowerCase().trim();

      if (activeLabel === s) {
        isActive = true;
      } else {
        isActive = false;
      }
    }

    // If not active → blank out driver details by design
    if (!isActive) {
      return { driverId: '', driverName: '' };
    }

    // Otherwise, return best-known driver info
    const driverId =
      String(v.currentDriverId ?? v.driverId ?? v.assignedDriverId ?? '') || '';
    const driverName =
      String(v.currentDriverName ?? v.driverName ?? v.assignedDriverName ?? '') ||
      '';

    return { driverId, driverName };
  } catch {
    return { driverId: '', driverName: '' };
  }
}

// Make a short human-friendly note for the expense row
function buildServiceExpenseNote(input: {
  dateISO: string;
  mechanic: string;
  itemsChanged: Array<{ name: string; quantity: number; unit: string; cost: number }>;
  extraNote?: string | null;
}) {
  const { dateISO, mechanic, itemsChanged, extraNote } = input;
  const head = `Service ${dateISO} | ${mechanic} `;
  const items = itemsChanged
    .slice(0, 5)
    .map((i) => `${i.name} x${i.quantity}${i.unit ? ` ${i.unit}` : ''}`)
    .join(', ');
  const itemsPart = items ? ` | Items: ${items}${itemsChanged.length > 5 ? '…' : ''}` : '';
  const tail = extraNote ? ` | Note: ${extraNote}` : '';
  return `${head}${itemsPart}${tail}`.slice(0, 900); // keep it tidy
}

// Upsert an expense income-log row that corresponds to a service record
// We link by source.serviceId so updates overwrite the same expense row.
export async function upsertExpenseForService(params: {
  serviceId: string;
  vehicleId: string;
  cost: number;
  serviceMileage: number;
  serviceDate: FirebaseFirestore.Timestamp;
  mechanic: string;
  itemsChanged: Array<{ name: string; quantity: number; unit: string; cost: number }>;
  notes: string | null;
}) {
  const {
    serviceId,
    vehicleId,
    cost,
    serviceMileage,
    serviceDate,
    mechanic,
    itemsChanged,
    notes,
  } = params;

  const dateISO = serviceDate.toDate().toISOString();

  // Try get driver details for richer accounting context
  const { driverId, driverName } = await getDriverDetailsForVehicle(vehicleId);

  // Look for an existing expense tied to this serviceId
  const existingQ = await incomeRef
    .where('source.kind', '==', 'service')
    .where('source.serviceId', '==', serviceId)
    .where('type', '==', 'expense') // LedgerType
    .limit(1)
    .get();

  const basePayload: Record<string, any> = {
    amount: Number(cost),
    weekEndingMileage: Number(serviceMileage),
    vehicle: String(vehicleId),
    driverId: driverId || '',
    driverName: driverName || '',
    type: 'expense', // <-- ensure matches your LedgerType
    note: buildServiceExpenseNote({
      dateISO,
      mechanic,
      itemsChanged,
      extraNote: notes,
    }),
    cashDate: serviceDate.toDate(), // pay out date == service date; adjust if you prefer createdAt
    source: { kind: 'service', serviceId },
    updatedAt: new Date(),
  };

  if (!existingQ.empty) {
    // Update existing expense row
    const docRef = existingQ.docs[0].ref;
    await docRef.update(basePayload);
    return docRef.id;
  } else {
    // Create a new expense row
    const now = new Date();
    const createPayload = {
      ...basePayload,
      createdAt: now,
    };
    const added = await incomeRef.add(createPayload);
    return added.id;
  }
}