"""Turn database objects into the JSON shapes the interface expects."""


def _label(enum_value):
    return enum_value.value if enum_value else None


def _amount(value):
    return float(value) if value is not None else 0


def serialize_item_service(service):
    return {
        "id": service.id,
        "service_definition_id": service.service_definition_id,
        "service_name": service.service_definition.service_name,
        "is_performed": service.is_performed,
    }


def serialize_item(item):
    model = item.product_model
    return {
        "id": item.id,
        "product_model": {
            "id": model.id if model else None,
            "name": model.name if model else "Bilinmeyen Ürün",
            "product_type": model.product_type.value if model else None,
        },
        "product_count": item.product_count,
        "production_date": item.production_date,
        "has_control_unit": item.has_control_unit,
        "warranty_status": _label(item.warranty_status),
        "fault_responsibility": _label(item.fault_responsibility),
        "resolution_method": _label(item.resolution_method),
        "cable_check": item.cable_check,
        "profile_check": item.profile_check,
        "packaging": item.packaging,
        "services": [serialize_item_service(s) for s in item.services],
    }


def serialize_case(case):
    customer = case.customer
    return {
        "id": case.id,
        "status": _label(case.workflow_status),
        "customer": {
            "id": customer.id if customer else None,
            "name": customer.name if customer else "Bilinmeyen Müşteri",
            "contact_info": customer.contact_info if customer else None,
            "address": customer.address if customer else None,
        },
        "arrival_date": case.arrival_date.isoformat() if case.arrival_date else None,
        "receipt_method": _label(case.receipt_method),
        "notes": case.notes,
        "shipping_info": case.shipping_info,
        "tracking_number": case.tracking_number,
        "shipping_date": case.shipping_date.isoformat() if case.shipping_date else None,
        "payment_status": _label(case.payment_status),
        "yedek_parca": _amount(case.yedek_parca),
        "bakim": _amount(case.bakim),
        "iscilik": _amount(case.iscilik),
        "cost": _amount(case.cost),
        "performed_services": case.performed_services,
        "items": [serialize_item(i) for i in case.items],
    }
