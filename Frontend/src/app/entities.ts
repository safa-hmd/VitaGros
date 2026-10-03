export interface Field { name: string; label: string; type: string; }
export interface Rel { field: string; label: string; target: string; display: string; }
export interface Entity {
  key: string; service: string; label: string; port: number; path: string;
  fields: Field[]; rel?: Rel;
}

// Genere a partir des 5 microservices (un port par microservice)
export const ENTITIES: Record<string, Entity> = {
  "roles": {
    "key": "roles",
    "service": "user",
    "label": "Role",
    "port": 8081,
    "path": "roles",
    "fields": [
      {
        "name": "name",
        "label": "name",
        "type": "text"
      },
      {
        "name": "description",
        "label": "description",
        "type": "text"
      }
    ]
  },
  "users": {
    "key": "users",
    "service": "user",
    "label": "User",
    "port": 8081,
    "path": "users",
    "fields": [
      {
        "name": "firstname",
        "label": "firstname",
        "type": "text"
      },
      {
        "name": "lastname",
        "label": "lastname",
        "type": "text"
      },
      {
        "name": "email",
        "label": "email",
        "type": "text"
      },
      {
        "name": "password",
        "label": "password",
        "type": "text"
      },
      {
        "name": "role",
        "label": "role",
        "type": "text"
      }
    ]
  },
  "categories": {
    "key": "categories",
    "service": "produit",
    "label": "Category",
    "port": 8082,
    "path": "categories",
    "fields": [
      {
        "name": "name",
        "label": "name",
        "type": "text"
      },
      {
        "name": "description",
        "label": "description",
        "type": "text"
      }
    ]
  },
  "products": {
    "key": "products",
    "service": "produit",
    "label": "Product",
    "port": 8082,
    "path": "products",
    "fields": [
      {
        "name": "name",
        "label": "name",
        "type": "text"
      },
      {
        "name": "price",
        "label": "price",
        "type": "number"
      },
      {
        "name": "stock",
        "label": "stock",
        "type": "number"
      }
    ],
    "rel": {
      "field": "category",
      "label": "Category",
      "target": "categories",
      "display": "name"
    }
  },
  "orders": {
    "key": "orders",
    "service": "commande",
    "label": "CustomerOrder",
    "port": 8083,
    "path": "orders",
    "fields": [
      {
        "name": "userId",
        "label": "userId",
        "type": "number"
      },
      {
        "name": "orderDate",
        "label": "orderDate",
        "type": "date"
      },
      {
        "name": "status",
        "label": "status",
        "type": "text"
      }
    ]
  },
  "order-lines": {
    "key": "order-lines",
    "service": "commande",
    "label": "OrderLine",
    "port": 8083,
    "path": "order-lines",
    "fields": [
      {
        "name": "productId",
        "label": "productId",
        "type": "number"
      },
      {
        "name": "quantity",
        "label": "quantity",
        "type": "number"
      },
      {
        "name": "unitPrice",
        "label": "unitPrice",
        "type": "number"
      }
    ],
    "rel": {
      "field": "customerOrder",
      "label": "CustomerOrder",
      "target": "orders",
      "display": "status"
    }
  },
  "invoices": {
    "key": "invoices",
    "service": "paiement",
    "label": "Invoice",
    "port": 8084,
    "path": "invoices",
    "fields": [
      {
        "name": "orderId",
        "label": "orderId",
        "type": "number"
      },
      {
        "name": "amount",
        "label": "amount",
        "type": "number"
      },
      {
        "name": "issueDate",
        "label": "issueDate",
        "type": "date"
      }
    ]
  },
  "payments": {
    "key": "payments",
    "service": "paiement",
    "label": "Payment",
    "port": 8084,
    "path": "payments",
    "fields": [
      {
        "name": "method",
        "label": "method",
        "type": "text"
      },
      {
        "name": "amount",
        "label": "amount",
        "type": "number"
      },
      {
        "name": "paidAt",
        "label": "paidAt",
        "type": "datetime-local"
      }
    ],
    "rel": {
      "field": "invoice",
      "label": "Invoice",
      "target": "invoices",
      "display": "orderId"
    }
  },
  "carriers": {
    "key": "carriers",
    "service": "livraison",
    "label": "Carrier",
    "port": 8085,
    "path": "carriers",
    "fields": [
      {
        "name": "name",
        "label": "name",
        "type": "text"
      },
      {
        "name": "phone",
        "label": "phone",
        "type": "text"
      }
    ]
  },
  "deliveries": {
    "key": "deliveries",
    "service": "livraison",
    "label": "Delivery",
    "port": 8085,
    "path": "deliveries",
    "fields": [
      {
        "name": "orderId",
        "label": "orderId",
        "type": "number"
      },
      {
        "name": "address",
        "label": "address",
        "type": "text"
      },
      {
        "name": "status",
        "label": "status",
        "type": "text"
      }
    ],
    "rel": {
      "field": "carrier",
      "label": "Carrier",
      "target": "carriers",
      "display": "name"
    }
  }
};

export const url = (e: Entity) => `http://localhost:${e.port}/api/${e.path}`;
