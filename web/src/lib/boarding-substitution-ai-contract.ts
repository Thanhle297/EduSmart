import { z } from 'zod'

const count = z.number().int().min(0).max(100_000)
const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/)

export const boardingSubstitutionAiInputSchema = z.object({
  request: z
    .object({
      id: z.string().min(1).max(100),
      date: z.iso.date(),
      kind: z.enum(['meal', 'rest']),
      area: z.string().min(1).max(200),
      start: time,
      end: time,
      classIds: z.array(z.string().max(20)).max(40),
      students: count,
      unlinkedPeople: count,
      historyWindowStart: z.iso.date(),
    })
    .refine((request) => request.start < request.end),
  preferences: z.string().max(600),
  candidates: z
    .array(
      z.object({
        teacherId: z.string().min(1).max(100),
        dutiesThisWeek: count,
        dutyMinutesThisWeek: count,
        dutiesOnDay: count,
        sameAreaDuties: count,
        sameKindDuties: count,
        teachingPeriodsThisWeek: count,
        teachingPeriodsOnDay: count,
      }),
    )
    .min(1)
    .max(200),
})

export type BoardingSubstitutionAiInput = z.infer<typeof boardingSubstitutionAiInputSchema>
