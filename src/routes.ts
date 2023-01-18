import { FastifyInstance } from "fastify"
import { prisma } from "./lib/prisma"
import dayjs from "dayjs"
import { z } from "zod"

export async function appRoutes(app: FastifyInstance) {
  app.post('/habits', async (request) => {
    const createHabitBody = z.object({
      title: z.string(),
      weekDays: z.array(
        z.number().min(0).max(6)
      )
    })

    const { title, weekDays } = createHabitBody.parse(request.body)

    const today = dayjs().startOf('day').toDate()

    await prisma.habit.create({
      data: {
        title,
        created_at: today,
        weekDays: {
          create: weekDays.map(weekDay => {
            return {
              week_day: weekDay
            }
          })
        }
      }
    })
    return
    // const habits = await prisma.habit.findMany({
    //   where: {
    //     title: {
    //       startsWith: 'Beber'
    //     }
    //   }
    // })
    //return habits
  })

  app.get('/day', async (request) => {
    const getDayParams = z.object({
      //convert string to date
      date: z.coerce.date()
    })

    const { date } = getDayParams.parse(request.query)

    const parsedDate = dayjs(date).startOf('day')
    const weekDay = parsedDate.get('day')
    
    const possibleHabits = await prisma.habit.findMany({
      where: {
        created_at: {
          lte: date,
        },
        weekDays: {
          some: {
            week_day: weekDay

          }
        }
      }
    })

    const day = await prisma.day.findUnique({
      where: {
        date: parsedDate.toDate()
      },
      include: {
        daysHabit: true
      }
    })

    const completedHabits = day?.daysHabit.map(dayHabit => {
      return dayHabit.habit_id
      
    })
    return {
      possibleHabits,
      completedHabits
    }
  })
}
