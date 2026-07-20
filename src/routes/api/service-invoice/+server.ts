import { json, type RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/server/db';

const GAJI_BONUS_URL = process.env.GAJI_BONUS_URL || 'https://gajibonusold.zapplerepair.com';

export const POST: RequestHandler = async ({ request, locals }) => {
    const session = locals.session;
    if (!session) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { serviceFormId } = body;

    if (!serviceFormId) {
        return json({ error: 'serviceFormId required' }, { status: 400 });
    }

    const serviceForm = await db.serviceForm.findUnique({
        where: { id: serviceFormId },
        include: {
            items: {
                include: { item: { include: { price: true } } }
            },
            invoice: true
        }
    });

    if (!serviceForm) {
        return json({ error: 'Service form not found' }, { status: 404 });
    }

    if (!serviceForm.invoice) {
        return json({ error: 'Invoice not yet created' }, { status: 400 });
    }

    const invoice = serviceForm.invoice;

    // Prepare data for gajibonusold
    const payload = {
        no_service: serviceForm.serviceNumber,
        customer_name: serviceForm.customerName,
        customer_phone: serviceForm.customerPhone,
        device_model: `${serviceForm.deviceType} ${serviceForm.deviceBrand || ''} ${serviceForm.deviceModel || ''}`.trim(),
        serial_no: serviceForm.deviceIMEI,
        problem_desc: serviceForm.problemDescription,
        service_cost: invoice.serviceCost,
        stock_items_total: invoice.stockItemsTotal,
        customer_purchase_total: invoice.customerPurchaseTotal,
        grand_total: invoice.grandTotal,
        items: serviceForm.items.map(sfi => ({
            description: sfi.item.name,
            price: sfi.item.price?.amount || 0,
            discount: 0,
            quantity: sfi.quantity,
            warranty: 0
        })),
        customer_purchases: invoice.customerPurchases
            ? JSON.parse(invoice.customerPurchases as string).map((cp: any) => ({
                name: cp.name,
                price: cp.price,
                quantity: cp.quantity
            }))
            : []
    };

    try {
        const response = await fetch(`${GAJI_BONUS_URL}/index.php/C_ServiceApi/create_invoice`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (result.success) {
            return json({
                success: true,
                message: 'Invoice synced to gajibonusold',
                print_url: `${GAJI_BONUS_URL}/trn_invoice_print/${serviceForm.serviceNumber}/jakut`
            });
        } else {
            return json({ error: result.error || 'Failed to sync' }, { status: 500 });
        }
    } catch (error) {
        console.error('Sync to gajibonusold failed:', error);
        return json({ error: 'Failed to connect to gajibonusold' }, { status: 500 });
    }
};
