import { boolean, integer, pgEnum, pgTable, primaryKey, real, serial, text, timestamp } from "drizzle-orm/pg-core"
import type { AdapterAccountType } from "next-auth/adapters"
import { createId } from "@paralleldrive/cuid2"
import { relations } from "drizzle-orm"

export const RoleEnum = pgEnum("roles", ["user", "admin"])

export const users = pgTable("user", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").unique(),
  password: text("password"),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
  twoFactorEnabled: boolean("twoFactorEnabled").default(false),
  role: RoleEnum("roles").default("user"),
  customerID: text("customerID"),
})

export const accounts = pgTable(
  "account",
  {
    userId: text("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccountType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => ({
    compoundKey: primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
  })
)

export const emailTokens = pgTable(
  "email_tokens",
  {
    id: text("id").notNull().$defaultFn(() => createId()),
    email: text("email").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (vt) => ({
    compoundKey: primaryKey({
      columns: [vt.id, vt.token]
    })
  }),
)

export const passwordResetTokens = pgTable(
  "password_reset_tokens",
  {
    id: text("id").notNull().$defaultFn(() => createId()),
    email: text("email").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (vt) => ({
    compoundKey: primaryKey({
      columns: [vt.id, vt.token]
    })
  }),
)

export const twoFactorTokens = pgTable(
  "two_factor_tokens",
  {
    id: text("id").notNull().$defaultFn(() => createId()),
    email: text("email").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (vt) => ({
    compoundKey: primaryKey({
      columns: [vt.id, vt.token]
    })
  }),
)

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  price: real("price").notNull(),
  category: text("category").notNull(),
  created: timestamp("created").defaultNow(),
})

export const productVariants = pgTable("productVariants", {
  id: serial("id").primaryKey(),
  productID: serial("productID").notNull().references(() => products.id, { onDelete: "cascade" }),
  color: text("color").notNull(),
  variantName: text("variantName").notNull(),
  updated: timestamp("updated").defaultNow().notNull(),
})

export const variantImages = pgTable("variantImages", {
  id: serial("id").primaryKey(),
  variantID: serial("variantID").notNull().references(() => productVariants.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  size: real("size").notNull(),
  name: text("name").notNull(),
  order: real("number").notNull(),
})

export const variantTags = pgTable("variantTags", {
  id: serial("id").primaryKey(),
  variantID: serial("variantID").notNull().references(() => productVariants.id, { onDelete: "cascade" }),
  tag: text("tag").notNull(),
})


// PRODUCT ==> PRODUCT VARIANTS // ONE-TO-MANY
export const productRelations = relations(products, ({ many }) => ({
  productVariants: many(productVariants),
}))

// PRODUCT VARIANTS ==> PRODUCT
// PRODUCT VARIANT ==> VARIANT IMAGES
// PRODUCT VARIANT ==> VARIANT TAGS
export const productVariantsRelations = relations(productVariants, ({ many, one }) => ({
  product: one(products, {
    fields: [productVariants.productID],
    references: [products.id],
  }),
  variantImages: many(variantImages),
  variantTags: many(variantTags),
}))

// VARIANT IMAGES ==> PRODUCT VARIANT
export const variantImagesRelations = relations(variantImages, ({ one }) => ({
  productVariants: one(productVariants, {
    fields: [variantImages.variantID],
    references: [productVariants.id],
  }),
}))

// VARIANT TAGS ==> PRODUCT VARIANT
export const variantTagsRelations = relations(variantTags, ({ one }) => ({
  productVariants: one(productVariants, {
    fields: [variantTags.variantID],
    references: [productVariants.id],
  }),
}))

export const userRelations = relations(users, ({ many }) => ({
  orders: many(orders),
}))

export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  userID: text("userID").notNull().references(() => users.id, { onDelete: "cascade" }),
  total: real("total").notNull(),
  status: text("status").notNull(),
  description: text("description").notNull(),
  created: timestamp("created").defaultNow(),
  updated: timestamp("updated").defaultNow().notNull(),
  receiptURL: text("receiptURL"),
  paymentIntentID: text("paymentIntentID"),
})

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  userID: text("userID").notNull().references(() => users.id, { onDelete: "cascade" }),
  total: real("total").notNull(),
  status: text("status").notNull(),
  created: timestamp("created").defaultNow(),
  receiptURL: text("receiptURL"),
  paymentIntentID: text("paymentIntentID"),
  pickupLocation: text("pickupLocation"),
})

export const orderItem = pgTable("orderItem", {
  id: serial("id").primaryKey(),
  productVariantID: serial("productVariantID").notNull().references(() => productVariants.id, { onDelete: "cascade" }),
  productID: serial("productID").notNull().references(() => products.id, { onDelete: "cascade" }),
  orderID: serial("orderID").notNull().references(() => orders.id, { onDelete: "cascade" }),
  quantity: integer("quantity").notNull(),
})

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, {
    fields: [orders.userID],
    references: [users.id]
  }),
  orderItem: many(orderItem)
}))

export const orderItemRelations = relations(orderItem, ({ one }) => ({
  order: one(orders, {
    fields: [orderItem.orderID],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItem.productID],
    references: [products.id],
  }),
  productVariant: one(productVariants, {
    fields: [orderItem.productVariantID],
    references: [productVariants.id],
  }),
}))