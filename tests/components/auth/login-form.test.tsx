import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { LoginForm } from "@/components/auth/login-form"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"

vi.mock("next-auth/react", () => ({
  signIn: vi.fn(),
}))

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}))

interface MockRouter {
  push: ReturnType<typeof vi.fn>
  refresh: ReturnType<typeof vi.fn>
}

describe("LoginForm", () => {
  const mockRouter: MockRouter = { push: vi.fn(), refresh: vi.fn() }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useRouter).mockReturnValue(mockRouter as unknown as ReturnType<typeof useRouter>)
  })

  it("renders form fields", () => {
    render(<LoginForm />)
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/senha/i)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /entrar/i })).toBeInTheDocument()
  })

  it("shows validation errors on empty submit", async () => {
    const user = userEvent.setup()
    render(<LoginForm />)

    await user.click(screen.getByRole("button", { name: /entrar/i }))

    expect(await screen.findByText(/email inválido/i)).toBeInTheDocument()
    expect(screen.getByText(/senha é obrigatória/i)).toBeInTheDocument()
  })

  it("shows email error for invalid email", async () => {
    const user = userEvent.setup()
    render(<LoginForm />)

    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/senha/i)

    await user.type(emailInput, "invalido")
    await user.type(passwordInput, "123456")
    // fire submit directly to bypass HTML5 email validation in jsdom
    const form = emailInput.closest("form")!
    fireEvent.submit(form)

    expect(await screen.findByText(/email inválido/i)).toBeInTheDocument()
  })

  it("calls signIn on valid submit", async () => {
    vi.mocked(signIn).mockResolvedValue({ ok: true, error: undefined } as Awaited<ReturnType<typeof signIn>>)

    const user = userEvent.setup()
    render(<LoginForm />)

    await user.type(screen.getByLabelText(/email/i), "a@b.com")
    await user.type(screen.getByLabelText(/senha/i), "123456")
    await user.click(screen.getByRole("button", { name: /entrar/i }))

    await vi.waitFor(() => {
      expect(signIn).toHaveBeenCalledWith("credentials", {
        email: "a@b.com",
        password: "123456",
        redirect: false,
      })
    })

    expect(mockRouter.push).toHaveBeenCalledWith("/")
    expect(mockRouter.refresh).toHaveBeenCalled()
  })

  it("displays root error on failed signIn", async () => {
    vi.mocked(signIn).mockResolvedValue({ ok: false, error: "Invalid credentials" } as Awaited<ReturnType<typeof signIn>>)

    const user = userEvent.setup()
    render(<LoginForm />)

    await user.type(screen.getByLabelText(/email/i), "a@b.com")
    await user.type(screen.getByLabelText(/senha/i), "123456")
    await user.click(screen.getByRole("button", { name: /entrar/i }))

    expect(await screen.findByText(/email ou senha inválidos/i)).toBeInTheDocument()
  })

  it("disables button while submitting", async () => {
    vi.mocked(signIn).mockImplementation(() => new Promise(() => {})) // never resolves

    const user = userEvent.setup()
    render(<LoginForm />)

    await user.type(screen.getByLabelText(/email/i), "a@b.com")
    await user.type(screen.getByLabelText(/senha/i), "123456")
    await user.click(screen.getByRole("button", { name: /entrar/i }))

    expect(await screen.findByRole("button", { name: /entrando/i })).toBeDisabled()
  })
})
