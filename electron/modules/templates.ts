import { loadDb, saveDb, getNextId } from '../db'
import type { NotificationTemplate } from '../db'

export function getNotificationTemplates(): NotificationTemplate[] {
  const db = loadDb()
  return [...db.notification_templates].sort((a, b) => a.id - b.id)
}

export function getTemplateByType(type: string): NotificationTemplate | undefined {
  const db = loadDb()
  return db.notification_templates.find(t => t.type === type)
}

export function addTemplate(template: Omit<NotificationTemplate, 'id' | 'created_at' | 'updated_at'>): number {
  const db = loadDb()
  const id = getNextId('notification_templates')
  const now = new Date().toISOString()

  const newTemplate: NotificationTemplate = {
    id,
    name: template.name,
    type: template.type,
    title: template.title,
    content: template.content,
    created_at: now,
    updated_at: now,
  }

  db.notification_templates.push(newTemplate)
  saveDb()
  return id
}

export function updateTemplate(id: number, template: Partial<NotificationTemplate>): void {
  const db = loadDb()
  const index = db.notification_templates.findIndex(t => t.id === id)
  if (index === -1) return

  db.notification_templates[index] = {
    ...db.notification_templates[index],
    ...template,
    id,
    updated_at: new Date().toISOString(),
  }
  saveDb()
}

export function deleteTemplate(id: number): void {
  const db = loadDb()
  const index = db.notification_templates.findIndex(t => t.id === id)
  if (index !== -1) {
    db.notification_templates.splice(index, 1)
    saveDb()
  }
}

export function renderTemplate(template: string, data: Record<string, string>): string {
  let result = template
  for (const [key, value] of Object.entries(data)) {
    result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value)
  }
  return result
}
