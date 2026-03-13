import { db } from '$lib/server/db'
import type { Section } from '../../../../generated/prisma/client'
import type { Actions, PageServerLoad } from './$types'

export const load: PageServerLoad = async () => {
    try {
        const sections = await db.section.findMany({
            include: {
                cabinet: true 
            }
        })

        const cabinets = await db.cabinet.findMany()

        return { 
            sections,
            cabinets 
        }
    } catch (error) {
        console.error('Load sections error:', error)
        return { 
            sections: [] as Section[],
            cabinets: [] 
        }
    }
}

export const actions: Actions = {
    delete: async ({ request }) => {
        const formData = await request.formData()
        const id = Number(formData.get('id'))

        if (isNaN(id)) {
            return {
                success: false,
                message: 'Invalid section ID'
            }
        }

        try {
            await db.section.delete({ where: { id } })

            return { 
                success: true, 
                message: 'Section deleted successfully!' 
            }
        } catch (error) {
            console.error('Delete section error:', error)
            return { 
                success: false, 
                message: 'Failed to delete section. Please try again.' 
            }
        }
    }
}