import Room from '@/components/Room'

type Props = {
    params: Promise<{ id: string }>
}

export default async function RoomPage({ params }: Props) {
    const { id } = await params

    return <Room roomId={id} />
}
