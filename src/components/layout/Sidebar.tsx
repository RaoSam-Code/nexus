'use client'

import { userColor, initials, displayName } from '@/lib/utils'

export interface RoomUser {
  user_id: string
  email: string
  online_at: string
  status?: string
}

interface Props {
  users: RoomUser[]
  currentUserId: string
}

export default function Sidebar({ users, currentUserId }: Props) {
  return (
    <div className="flex flex-col h-full border-r border-white/8 bg-[#010f1f]/60 backdrop-blur-xl">
      <div className="px-4 py-3 border-b border-white/8">
        <p className="text-xs font-semibold text-[#7090b0] uppercase tracking-wider">
          Members · {users.length}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        {users.map(user => {
          const color = userColor(user.user_id)
          const isMe = user.user_id === currentUserId
          const name = displayName(user.email)
          const init = initials(user.email)

          return (
            <div
              key={user.user_id}
              className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-white/5 transition-colors"
            >
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-[#010f1f]"
                  style={{ background: color }}
                >
                  {init}
                </div>
                {/* Online dot */}
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#22c55e] border-2 border-[#010f1f]" />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#d4e4fa] truncate capitalize">
                  {name}
                  {isMe && <span className="text-[#7090b0] text-xs ml-1">(you)</span>}
                </p>
                <p className="text-[10px] text-[#7090b0] capitalize">
                  {user.status || 'online'}
                </p>
              </div>
            </div>
          )
        })}

        {users.length === 0 && (
          <div className="text-center py-8 text-xs text-[#7090b0]">
            Waiting for others…
          </div>
        )}
      </div>
    </div>
  )
}
