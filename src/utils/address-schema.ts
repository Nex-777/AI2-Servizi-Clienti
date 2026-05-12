import { z } from "zod";

export const addressSchema = z.object({
  provincia: z.string().min(2, "La provincia è obbligatoria"),
  comune: z.string().min(1, "Il comune è obbligatorio"),
  cap: z.string().length(5, "Il CAP deve essere di 5 cifre"),
  via: z.string().min(3, "La via è obbligatoria"),
  civico: z.string().min(1, "Il numero civico è obbligatorio"),
  is_verified: z.boolean().default(false),
});

export type AddressFormData = z.infer<typeof addressSchema>;
