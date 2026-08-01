import { z } from 'zod'

const ItemSchema = z.object({
	name: z.string().min(1, 'Name is required!'),
	stock: z.coerce.number().default(0),
	location: z.string().min(1, 'Location is required!'),
	category: z.string().min(1, 'Category is required!'),
	subCategory: z.string().min(1, 'Subcategory is required!'),

	serialNumber: z.string().optional().or(z.literal('')),

	videoUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
	qrCustomUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
	file: z.unknown().optional(),
	sectionId: z.coerce.number({ error: 'Section id is required!' }),

	isCustomer: z.boolean().optional().default(false),

	priceIdr: z.coerce.number().min(0, 'IDR price must be 0 or more!').optional().default(0),
	priceNoteIdr: z.string().optional().default(''),
	priceSgd: z.coerce.number().min(0, 'SGD price must be 0 or more!').optional().default(0),
	priceNoteSgd: z.string().optional().default(''),

	costPriceSgd: z.coerce.number().min(0, 'Cost price must be 0 or more!').optional().default(0),
	costNoteSgd: z.string().optional().default(''),
})

export default ItemSchema