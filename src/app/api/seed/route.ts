import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { apiSuccess, Errors } from '@/lib/errors'
import { hash } from 'bcryptjs'
import { emitEvent, EventType } from '@/lib/events'

// Seed endpoint — call once to populate initial data
// DELETE after first use in production!
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const seedKey = process.env.JWT_SECRET || 'journey-os-jwt-secret-dev'
  if (authHeader !== `Bearer ${seedKey}`) {
    return Errors.FORBIDDEN('Invalid seed key')
  }

  try {
    // Check if already seeded
    const userCount = await db.user.count()
    if (userCount > 0) {
      return apiSuccess({ message: 'Database already seeded', userCount })
    }

    const passwordHash = await hash('admin123', 12)

    // Create admin user
    const admin = await db.user.create({
      data: {
        email: 'admin@journey-os.com',
        password: passwordHash,
        firstName: 'Админ',
        lastName: 'Системы',
        role: 'ADMIN',
        isActive: true,
      },
    })

    emitEvent(EventType.USER_CREATED, { userId: admin.id, role: admin.role })

    // Create HR user
    const hr = await db.user.create({
      data: {
        email: 'hr@journey-os.com',
        password: await hash('hr123', 12),
        firstName: 'Мария',
        lastName: 'HR',
        role: 'HR',
        isActive: true,
      },
    })

    // Create mentor user
    const mentor = await db.user.create({
      data: {
        email: 'mentor@journey-os.com',
        password: await hash('mentor123', 12),
        firstName: 'Алексей',
        lastName: 'Наставник',
        role: 'MENTOR',
        isActive: true,
      },
    })

    // Create manager user
    const manager = await db.user.create({
      data: {
        email: 'manager@journey-os.com',
        password: await hash('manager123', 12),
        firstName: 'Ольга',
        lastName: 'Руководитель',
        role: 'MANAGER',
        isActive: true,
      },
    })

    // Create employee with journey
    const employee = await db.user.create({
      data: {
        email: 'employee@journey-os.com',
        password: await hash('emp123', 12),
        firstName: 'Иван',
        lastName: 'Новый',
        role: 'EMPLOYEE',
        isActive: true,
        journey: {
          create: {
            status: 'ACTIVE',
            startedAt: new Date(),
            stages: {
              create: [
                {
                  name: 'Day 1 — Первый день',
                  description: 'Знакомство с компанией, доступы, вводный курс',
                  order: 1,
                  status: 'ACTIVE',
                  tasks: {
                    create: [
                      { title: 'Ознакомиться с миссией и ценностями компании', type: 'LESSON', status: 'COMPLETED', completedAt: new Date() },
                      { title: 'Получить доступ к корпоративной почте', type: 'CHECKLIST', status: 'COMPLETED', completedAt: new Date() },
                      { title: 'Установить рабочее ПО', type: 'CHECKLIST', status: 'IN_PROGRESS' },
                      { title: 'Пройти вводный тест', type: 'QUIZ', status: 'PENDING' },
                    ],
                  },
                },
                {
                  name: 'Week 1 — Первая неделя',
                  description: 'Обучение, тесты, наставник',
                  order: 2,
                  status: 'PENDING',
                  tasks: {
                    create: [
                      { title: 'Пройти курс по продукту', type: 'LESSON', status: 'PENDING' },
                      { title: 'Встреча с наставником', type: 'MEETING', status: 'PENDING' },
                      { title: 'Изучить рабочие процессы', type: 'DOCUMENT', status: 'PENDING' },
                      { title: 'Тест по продукту', type: 'QUIZ', status: 'PENDING' },
                    ],
                  },
                },
                {
                  name: 'Month 1 — Первый месяц',
                  description: 'Первая задача, контроль',
                  order: 3,
                  status: 'PENDING',
                  tasks: {
                    create: [
                      { title: 'Выполнить первую рабочую задачу', type: 'CUSTOM', status: 'PENDING' },
                      { title: 'Получить обратную связь от руководителя', type: 'MEETING', status: 'PENDING' },
                      { title: 'Заполнить чеклист первого месяца', type: 'CHECKLIST', status: 'PENDING' },
                    ],
                  },
                },
                {
                  name: 'Month 3 — Аттестация',
                  description: 'Оценка, аттестация',
                  order: 4,
                  status: 'PENDING',
                  tasks: {
                    create: [
                      { title: 'Подготовить отчет о проделанной работе', type: 'DOCUMENT', status: 'PENDING' },
                      { title: 'Пройти аттестационный тест', type: 'QUIZ', status: 'PENDING' },
                      { title: 'Встреча с HR для оценки', type: 'MEETING', status: 'PENDING' },
                    ],
                  },
                },
              ],
            },
          },
        },
      },
    })

    emitEvent(EventType.USER_CREATED, { userId: employee.id, role: employee.role })
    emitEvent(EventType.JOURNEY_STARTED, { journeyId: employee.journey?.id, userId: employee.id })

    // Create mentor profile
    await db.mentor.create({
      data: {
        userId: mentor.id,
      },
    })

    return apiSuccess({
      message: 'Database seeded successfully',
      users: { admin, hr, mentor, manager, employee },
      credentials: {
        admin: 'admin@journey-os.com / admin123',
        hr: 'hr@journey-os.com / hr123',
        mentor: 'mentor@journey-os.com / mentor123',
        manager: 'manager@journey-os.com / manager123',
        employee: 'employee@journey-os.com / emp123',
      },
    }, 201)
  } catch (error) {
    console.error('[Seed Error]', error)
    return Errors.VALIDATION_ERROR('Seed failed: ' + String(error))
  }
}
