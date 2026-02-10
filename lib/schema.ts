import { pgTable, serial, text, timestamp, integer, boolean, uuid, jsonb, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';


export const roleEnum = pgEnum("role", ["admin", "customer", "vendor"]);
// 1. Таблица тендеров (Лоты)
// 1. Таблица тендеров (Лоты) с поддержкой динамических параметров и файлов
export const tenders = pgTable('tenders', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  price: text('price').notNull(),
  
  // Логика категорий
  category: text('category').notNull(), 
  subCategory: text('sub_category'),    
  workType: text('work_type'),          
  
  // ФАЙЛ 1: Смета (Excel)
  attachmentUrl: text('attachment_url'),   
  attachmentName: text('attachment_name'), 

  // ФАЙЛ 2: Ведомость объемов (PDF/Doc)
  volumeUrl: text('volume_url'),           // Добавлено
  volumeName: text('volume_name'),         // Добавлено

  // Динамические требования
  requirements: jsonb('requirements').$type<string[]>().default(['Отсутствие налоговой задолженности']),

  status: text('status').default('Активен'), 
  description: text('description'),
  
  winnerId: integer('winner_id'), 
  createdAt: timestamp('created_at').defaultNow(),
});
// 2. Таблица откликов (Предложения от поставщиков)
export const bids = pgTable('bids', {
  id: serial('id').primaryKey(),
  tenderId: integer('tender_id')
    .references(() => tenders.id, { onDelete: 'cascade' })
    .notNull(),
  // СВЯЗКА: Кто именно подал заявку
  userId: text('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  vendorName: text('vendor_name').notNull(),
  offerPrice: text('offer_price').notNull(),
  message: text('message'),
  isRead: boolean('is_read').default(false),
  isWinnerRead: boolean('is_winner_read').default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

// 3. Определение связей (Relations)
// Это позволит использовать db.query.tenders.findMany({ with: { bids: true } })
export const tendersRelations = relations(tenders, ({ many }) => ({
  bids: many(bids),
}));

export const bidsRelations = relations(bids, ({ one }) => ({
  tender: one(tenders, {
    fields: [bids.tenderId],
    references: [tenders.id],
  }),
}));

export const organizations = pgTable("organizations", {
  // Вместо serial() используем явный инкремент
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(), 
  name: text("name").notNull(),
  bin: text("bin"),
  userId: text("userId").notNull().references(() => users.id),
});

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(), // Хэшированный пароль
  name: text('name').notNull(),
  role: text('role').$type<'admin' | 'customer' | 'vendor'>().default('vendor'),
  iin: text('iin').unique(), // Оставим для будущей связки с ЭЦП
  createdAt: timestamp('created_at').defaultNow(),
  bin: text('bin'), 
  companyName: text('company_name'),
});

export const usersRelations = relations(users, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [users.id],
    references: [organizations.userId],
  }),
  bids: many(bids),
}));

export const organizationsRelations = relations(organizations, ({ one }) => ({
  user: one(users, {
    fields: [organizations.userId],
    references: [users.id],
  }),
}));

export const auditLogs = pgTable("audit_logs", {
  // Аналогично здесь
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: text("userId").notNull().references(() => users.id),
  action: text("action").notNull(),
  targetId: text("targetId"),
  details: jsonb("details"),
  createdAt: timestamp("createdAt").defaultNow(),
});