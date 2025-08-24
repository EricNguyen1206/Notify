'use server'

import { createClientForServer } from './supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function handleRegister(prevState: any, formData: FormData) {
  try {
    const supabase = await createClientForServer()
    
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const name = formData.get('name') as string
    const adminCode = formData.get('adminCode') as string
    const agree = formData.get('agree') as string

    // Validate required fields
    if (!email || !password || !name) {
      return {
        error: 'Please fill in all required fields'
      }
    }

    // Check if user agreed to terms
    if (!agree) {
      return {
        error: 'You must agree to the terms of service to continue'
      }
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return {
        error: 'Please enter a valid email address'
      }
    }

    // Validate password strength
    if (password.length < 6) {
      return {
        error: 'Password must be at least 6 characters long'
      }
    }

    // Check if admin code is provided and valid (optional)
    let isAdmin = false
    if (adminCode) {
      // You can implement admin code validation here
      // For now, we'll just check if it matches a specific code
      if (adminCode === process.env.ADMIN_CODE) {
        isAdmin = true
      }
    }

    // Create user account
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          is_admin: isAdmin
        }
      }
    })

    if (error) {
      return {
        error: error.message
      }
    }

    // If user was created successfully
    if (data.user) {
      return {
        message: 'Register account successfully'
      }
    }

    return {
      error: 'An unexpected error occurred'
    }

  } catch (error) {
    console.error('Registration error:', error)
    return {
      error: 'An unexpected error occurred during registration'
    }
  }
}

export async function handleLogin(prevState: any, formData: FormData) {
  try {
    const supabase = await createClientForServer()
    
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    // Validate required fields
    if (!email || !password) {
      return {
        error: 'Please fill in all required fields'
      }
    }

    // Attempt to sign in
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      return {
        error: error.message
      }
    }

    // If login successful, redirect to dashboard
    if (data.user) {
      revalidatePath('/', 'layout')
      redirect('/')
    }

    return {
      error: 'An unexpected error occurred'
    }

  } catch (error) {
    console.error('Login error:', error)
    return {
      error: 'An unexpected error occurred during login'
    }
  }
}
