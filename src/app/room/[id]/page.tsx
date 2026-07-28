import RoomShell from '@/components/room/RoomShell'

interface Props {
  params: Promise<{ id: string }>
}

export default async function RoomPage({ params }: Props) {
  const { id } = await params

  return <RoomShell roomId={id} roomName="Nexus Room" />
}
