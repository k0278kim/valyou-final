import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";

export const postRouter = createTRPCRouter({
  hello: publicProcedure
    .input(z.object({ text: z.string() }))
    .query(({ input }) => {
      return {
        greeting: `Hello ${input.text}`,
      };
    }),

  create: protectedProcedure
    .input(z.object({ name: z.string().min(1) }))
    .mutation(async ({ input }) => {
      // Mock implementation for LocalStorage migration
      return {
        id: Math.random(),
        name: input.name,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdById: "mock-user-id",
      };
    }),

  getLatest: protectedProcedure.query(async () => {
    // Mock implementation for LocalStorage migration
    return null;
  }),

  getSecretMessage: protectedProcedure.query(() => {
    return "you can now see this secret message!";
  }),
});
