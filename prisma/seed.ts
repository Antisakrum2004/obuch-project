import { PrismaClient, UserRole } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create departments
  const engineering = await prisma.department.create({
    data: { name: 'Engineering' },
  })
  const product = await prisma.department.create({
    data: { name: 'Product' },
  })
  const hrDept = await prisma.department.create({
    data: { name: 'Human Resources' },
  })

  // Create admin user
  const adminPassword = await hash('admin123', 12)
  const admin = await prisma.user.create({
    data: {
      email: 'admin@journey-os.com',
      password: adminPassword,
      firstName: 'Admin',
      lastName: 'System',
      role: UserRole.ADMIN,
      departmentId: hrDept.id,
      isActive: true,
    },
  })

  // Create HR user
  const hrPassword = await hash('hr123', 12)
  const hr = await prisma.user.create({
    data: {
      email: 'hr@journey-os.com',
      password: hrPassword,
      firstName: 'Мария',
      lastName: 'Иванова',
      role: UserRole.HR,
      departmentId: hrDept.id,
      isActive: true,
    },
  })

  // Create mentor user
  const mentorPassword = await hash('mentor123', 12)
  const mentorUser = await prisma.user.create({
    data: {
      email: 'mentor@journey-os.com',
      password: mentorPassword,
      firstName: 'Алексей',
      lastName: 'Петров',
      role: UserRole.MENTOR,
      departmentId: engineering.id,
      isActive: true,
    },
  })

  // Create mentor profile
  await prisma.mentor.create({
    data: { userId: mentorUser.id },
  })

  // Create manager user
  const managerPassword = await hash('manager123', 12)
  await prisma.user.create({
    data: {
      email: 'manager@journey-os.com',
      password: managerPassword,
      firstName: 'Дмитрий',
      lastName: 'Сидоров',
      role: UserRole.MANAGER,
      departmentId: engineering.id,
      isActive: true,
    },
  })

  // Create employee user with a sample journey
  const empPassword = await hash('emp123', 12)
  const employee = await prisma.user.create({
    data: {
      email: 'employee@journey-os.com',
      password: empPassword,
      firstName: 'Елена',
      lastName: 'Козлова',
      role: UserRole.EMPLOYEE,
      departmentId: engineering.id,
      isActive: true,
    },
  })

  // Create sample journey for employee
  const journey = await prisma.journey.create({
    data: {
      userId: employee.id,
      status: 'ACTIVE',
      startedAt: new Date(),
    },
  })

  // Create stages with tasks
  const stage1 = await prisma.stage.create({
    data: {
      journeyId: journey.id,
      name: 'Day 1 — Первый день',
      description: 'Знакомство с компанией, доступы, вводный курс',
      order: 1,
      status: 'ACTIVE',
      dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
    },
  })

  const stage2 = await prisma.stage.create({
    data: {
      journeyId: journey.id,
      name: 'Week 1 — Первая неделя',
      description: 'Обучение, тесты, наставник',
      order: 2,
      status: 'PENDING',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  })

  const stage3 = await prisma.stage.create({
    data: {
      journeyId: journey.id,
      name: 'Month 1 — Первый месяц',
      description: 'Первая задача, контроль',
      order: 3,
      status: 'PENDING',
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  })

  const stage4 = await prisma.stage.create({
    data: {
      journeyId: journey.id,
      name: 'Month 3 — Аттестация',
      description: 'Оценка, аттестация',
      order: 4,
      status: 'PENDING',
      dueDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    },
  })

  // Tasks for Stage 1 (Day 1)
  await prisma.task.createMany({
    data: [
      { stageId: stage1.id, title: 'Получить доступ к корпоративной почте', type: 'CHECKLIST', status: 'COMPLETED', completedAt: new Date() },
      { stageId: stage1.id, title: 'Пройти вводный курс о компании', type: 'LESSON', status: 'COMPLETED', completedAt: new Date() },
      { stageId: stage1.id, title: 'Познакомиться с командой', type: 'MEETING', status: 'IN_PROGRESS' },
      { stageId: stage1.id, title: 'Настроить рабочее окружение', type: 'CHECKLIST', status: 'PENDING' },
    ],
  })

  // Tasks for Stage 2 (Week 1)
  await prisma.task.createMany({
    data: [
      { stageId: stage2.id, title: 'Пройти курс по продукту', type: 'LESSON', status: 'PENDING' },
      { stageId: stage2.id, title: 'Тест по продукту', type: 'QUIZ', status: 'PENDING' },
      { stageId: stage2.id, title: 'Встреча с наставником', type: 'MEETING', status: 'PENDING' },
      { stageId: stage2.id, title: 'Изучить кодовую базу', type: 'DOCUMENT', status: 'PENDING' },
    ],
  })

  // Tasks for Stage 3 (Month 1)
  await prisma.task.createMany({
    data: [
      { stageId: stage3.id, title: 'Первая рабочая задача', type: 'CUSTOM', status: 'PENDING' },
      { stageId: stage3.id, title: 'Код-ревью с наставником', type: 'MEETING', status: 'PENDING' },
      { stageId: stage3.id, title: 'Промежуточный тест', type: 'QUIZ', status: 'PENDING' },
    ],
  })

  // Tasks for Stage 4 (Month 3)
  await prisma.task.createMany({
    data: [
      { stageId: stage4.id, title: 'Аттестационный тест', type: 'QUIZ', status: 'PENDING' },
      { stageId: stage4.id, title: 'Обратная связь от руководителя', type: 'MEETING', status: 'PENDING' },
      { stageId: stage4.id, title: 'Самооценка компетенций', type: 'CHECKLIST', status: 'PENDING' },
    ],
  })

  // Create journey event
  await prisma.journeyEvent.create({
    data: {
      journeyId: journey.id,
      type: 'journey.started',
      payload: JSON.stringify({ activatedBy: hr.id }),
    },
  })

  console.log('✅ Seed completed!')
  console.log('📋 Users created:')
  console.log('   Admin:    admin@journey-os.com / admin123')
  console.log('   HR:       hr@journey-os.com / hr123')
  console.log('   Mentor:   mentor@journey-os.com / mentor123')
  console.log('   Manager:  manager@journey-os.com / manager123')
  console.log('   Employee: employee@journey-os.com / emp123')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
