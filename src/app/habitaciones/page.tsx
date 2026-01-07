import { RoomsView } from "@/components/RoomsView";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: 'Habitaciones en Alquiler en Murcia | RentiaRoom',
    description: 'Encuentra tu habitación ideal en Murcia. Habitaciones premium, totalmente equipadas y con todos los gastos incluidos. Alquiler seguro y sin sorpresas.',
};

export default function RoomsPage() {
    return <RoomsView />;
}
