import { pgTable, serial, text, timestamp, integer, boolean } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// 1. Таблица тендеров (Лоты)
export const tenders = pgTable('tenders', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  price: text('price').notNull(),
  type: text('type').notNull(),
  status: text('status').default('Активен'),
  winnerId: integer('winner_id'), // Сюда запишем ID заявки (bid) победителя
  // 'created_at' — имя в БД, createdAt — имя в коде
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

export const organizations = pgTable('organizations', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  bin: text('bin').unique(),
  userId: text('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
});

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(), // Хэшированный пароль
  name: text('name').notNull(),
  role: text('role').$type<'admin' | 'vendor'>().default('vendor'),
  iin: text('iin').unique(), // Оставим для будущей связки с ЭЦП
  createdAt: timestamp('created_at').defaultNow(),
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