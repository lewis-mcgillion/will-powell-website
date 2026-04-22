import { z } from 'zod';

export const repairRequestSchema = z.object({
  customerName: z.string().min(2, 'Please enter your name.'),
  phone: z.string().min(7, 'Please enter a phone number.'),
  email: z.string().email('Please enter a valid email.').optional().or(z.literal('')),
  postcode: z.string().min(3, 'Please enter a postcode.'),
  applianceType: z.string().min(2, 'Please choose an appliance type.'),
  brand: z.string().optional(),
  faultDescription: z.string().min(10, 'Please describe the fault.'),
  preferredContactMethod: z.string().min(2, 'Please choose a contact method.'),
  preferredWindow: z.string().optional(),
  sourcePath: z.string().optional(),
});

export type RepairRequestFormValues = z.infer<typeof repairRequestSchema>;
