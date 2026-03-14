import { z } from 'zod'

const CardSchema = z.object({
	name: z.string().min(1, 'Name is required!'),
	price: z.coerce.number({ error: 'Price is required!' }),
	priceNote: z.string().min(1, 'Price note is required!'),
	stock: z.coerce.number().default(0),
	location: z.string().min(1, 'Location is required!'),
	category: z.string().min(1, 'Category is required!'),
	subCategory: z.string().min(1, 'Subcategory is required!'),
	file: z.unknown().optional(),
	sectionId: z.coerce.number({ error: 'Section id is required!' })
})

export default CardSchema
