import { z } from 'zod'

const count = z.number().int().min(0).max(2000)

export const substitutionAiInputSchema = z.object({
  request: z.object({
    id: z.string().min(1).max(100),
    subject: z.string().min(1).max(150),
    classId: z.string().min(1).max(30),
    date: z.iso.date(),
    period: z.number().int().min(1).max(9),
  }),
  preferences: z.string().max(600),
  candidates: z.array(z.object({
    teacherId: z.string().min(1).max(100),
    plannedPeriods: count,
    allowance: count,
    quota: count,
    substitutePeriodsThisWeek: count,
    periodsOnDay: count,
    teachesClass: z.boolean(),
    isHomeroomTeacher: z.boolean(),
  })).min(1).max(200),
})

export const substitutionAiAnalysisSchema = z.object({
  summary: z.string().min(1).max(1200),
  recommendations: z.array(z.object({
    teacherId: z.string().min(1).max(100),
    reason: z.string().min(1).max(800),
    cautions: z.array(z.string().min(1).max(400)).max(3),
  })).min(1).max(3),
  warnings: z.array(z.string().min(1).max(400)).max(4),
})

export const substitutionAiResultSchema = substitutionAiAnalysisSchema.extend({
  model: z.string(),
})

export const substitutionAiStatusSchema = z.object({
  configured: z.boolean(),
  model: z.string(),
})

export type SubstitutionAiInput = z.infer<typeof substitutionAiInputSchema>
export type SubstitutionAiResult = z.infer<typeof substitutionAiResultSchema>
