import { supabase } from './supabase'

/**
 * Get current user (authenticated or anonymous)
 * Returns user ID and email for both logged-in users and anonymous guests
 */
export async function getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
        // Authenticated user
        return {
            id: user.id,
            email: user.email!,
        }
    } else {
        // Anonymous user - create temporary identity
        const anonymousId = localStorage.getItem('anonymous_user_id') || crypto.randomUUID()
        const anonymousEmail = localStorage.getItem('anonymous_user_email') || `guest_${anonymousId.slice(0, 8)}@nexus.local`

        // Save to localStorage for persistence
        localStorage.setItem('anonymous_user_id', anonymousId)
        localStorage.setItem('anonymous_user_email', anonymousEmail)

        return {
            id: anonymousId,
            email: anonymousEmail,
        }
    }
}
