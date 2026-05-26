// import { createServerClient } from '@supabase/ssr'
// import { NextResponse, type NextRequest } from 'next/server'

// export async function middleware(request: NextRequest) {
//   let response = NextResponse.next({
//     request: {
//       headers: request.headers,
//     },
//   })

//   const supabase = createServerClient(
//     process.env.NEXT_PUBLIC_SUPABASE_URL!,
//     process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
//     {
//       cookies: {
//         getAll() {
//           return request.cookies.getAll()
//         },
//         setAll(cookiesToSet) {
//           cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value, options))
//           response = NextResponse.next({
//             request: {
//               headers: request.headers,
//             },
//           })
//           cookiesToSet.forEach(({ name, value, options }) =>
//             response.cookies.set(name, value, options)
//           )
//         },
//       },
//     }
//   )

//   // Fetch the current authenticated session
//   const { data: { user } } = await supabase.auth.getUser()

//   // Protected Route Guardrail: If trying to access /admin and not logged in, redirect to login page
//   if (request.nextUrl.pathname.startsWith('/admin') && !user) {
//     return NextResponse.redirect(new URL('/login', request.url))
//   }

//   return response
// }

// export const config = {
//   matcher: ['/admin/:path*'], // Protects the admin panel and any sub-routes
// }