import Link from 'next/link'
import { ArrowRight, Globe2, ShieldCheck, WalletCards } from 'lucide-react'

const stats = [
  { label: 'Freelancers onboarded', value: '12k+' },
  { label: 'Monthly volume', value: '$4.8M' },
  { label: 'Supported countries', value: '14' },
]

const features = [
  {
    title: 'Global invoices in minutes',
    description: 'Create polished invoices, share payment links, and track status in real-time.',
    icon: Globe2,
  },
  {
    title: 'Safer payouts',
    description: 'Move funds with built-in checks, account controls, and secure session flows.',
    icon: ShieldCheck,
  },
  {
    title: 'Unified balances',
    description: 'See your balances and withdrawals across currencies from one clean dashboard.',
    icon: WalletCards,
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#F6F8FC] text-[#0A1228]">
      <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-6 md:px-10">
        <div className="text-2xl font-black tracking-tight text-[#1B4FFF]">nera</div>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="rounded-xl border border-[#D7DEEA] bg-white px-4 py-2 text-sm font-semibold text-[#24314D] transition hover:border-[#B8C4DA]"
          >
            Log in
          </Link>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 rounded-xl bg-[#1B4FFF] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#1744DA]"
          >
            Get started
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-7xl gap-10 px-6 pb-16 pt-8 md:px-10 md:pt-14 lg:grid-cols-[1.2fr_0.8fr]">
        <section>
          <p className="mb-4 inline-flex rounded-full border border-[#D8E0EE] bg-white px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-[#3D4E77]">
            Professional payments for African freelancers
          </p>
          <h1 className="max-w-3xl text-4xl font-black leading-[1.05] tracking-[-0.03em] text-[#0A1228] md:text-6xl">
            Get paid globally.
            <br />
            Withdraw locally.
          </h1>
          <p className="mt-5 max-w-2xl text-base text-[#4A5A7E] md:text-lg">
            Nera helps independent professionals send invoices, collect payments in major currencies,
            and move money back home with confidence.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-2xl bg-[#1B4FFF] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#1744DA]"
            >
              Create free account
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/login"
              className="rounded-2xl border border-[#CBD5E6] bg-white px-6 py-3 text-sm font-bold text-[#26324D] transition hover:border-[#9FB0CE]"
            >
              I already have an account
            </Link>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {stats.map((item) => (
              <article key={item.label} className="rounded-2xl border border-[#E0E6F2] bg-white p-4">
                <p className="text-2xl font-black tracking-tight text-[#101A34]">{item.value}</p>
                <p className="mt-1 text-xs font-semibold uppercase tracking-[0.08em] text-[#617197]">
                  {item.label}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="relative">
          <div className="absolute -left-4 -top-4 h-40 w-40 rounded-full bg-[#1B4FFF1A] blur-2xl" />
          <div className="absolute -bottom-8 -right-4 h-40 w-40 rounded-full bg-[#F5C84233] blur-2xl" />

          <div className="relative rounded-3xl border border-[#DDE5F4] bg-white p-6 shadow-[0_24px_60px_rgba(13,26,62,0.08)]">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#5D6F97]">Why teams pick Nera</p>

            <div className="mt-5 space-y-4">
              {features.map((feature) => {
                const Icon = feature.icon
                return (
                  <article key={feature.title} className="rounded-2xl border border-[#E3EAF6] bg-[#FBFCFF] p-4">
                    <div className="flex items-start gap-3">
                      <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#1B4FFF12] text-[#1B4FFF]">
                        <Icon className="h-4 w-4" />
                      </span>
                      <div>
                        <h2 className="text-sm font-extrabold text-[#152141]">{feature.title}</h2>
                        <p className="mt-1 text-sm text-[#506089]">{feature.description}</p>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
