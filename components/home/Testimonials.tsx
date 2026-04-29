"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Star } from "lucide-react"
import { testimonials } from "@/lib/mock-data"

export default function Testimonials() {
  return (
    <section id="testimonials" className="py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <Badge className="mb-4 border border-amber-300/30 bg-amber-400/10 text-amber-200 hover:bg-amber-400/20">Testimonials</Badge>
          <h2 className="text-balance text-3xl font-bold tracking-tight text-slate-100 sm:text-4xl">
            Loved by aspiring freelancers
          </h2>
        </div>
        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((t) => (
            <Card key={t.name} className="border-white/10 bg-white/4 shadow-lg shadow-black/20 transition hover:-translate-y-1 hover:border-amber-300/35">
              <CardContent className="p-6">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-300 text-amber-300" />
                  ))}
                </div>
                <p className="text-sm leading-relaxed text-slate-300">{`"${t.content}"`}</p>
                <div className="mt-4 flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-cyan-300/10 text-cyan-200 text-sm font-medium">
                      {t.avatar}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-semibold text-slate-100">{t.name}</p>
                    <p className="text-xs text-slate-400">{t.role}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}