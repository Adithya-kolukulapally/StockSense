const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

dotenv.config({ path: __dirname + '/../.env' });

const User = require('../models/User');
const Category = require('../models/Category');
const Warehouse = require('../models/Warehouse');
const Location = require('../models/Location');
const Product = require('../models/Product');
const Inventory = require('../models/Inventory');
const Receipt = require('../models/Receipt');
const Delivery = require('../models/Delivery');
const InternalTransfer = require('../models/InternalTransfer');
const StockAdjustment = require('../models/StockAdjustment');
const StockLedger = require('../models/StockLedger');

const seed = async () => {
    try {
        const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/stocksense';
        console.log(`Connecting to MongoDB at: ${uri}`);
        await mongoose.connect(uri);
        console.log('✅ Connected to MongoDB. Seeding initial data...');

        // Clear existing collections
        await Promise.all([
            User.deleteMany(),
            Category.deleteMany(),
            Warehouse.deleteMany(),
            Location.deleteMany(),
            Product.deleteMany(),
            Inventory.deleteMany(),
            Receipt.deleteMany(),
            Delivery.deleteMany(),
            InternalTransfer.deleteMany(),
            StockAdjustment.deleteMany(),
            StockLedger.deleteMany()
        ]);
        console.log('🧹 Cleared existing data');

        // 1. Users (password will be hashed once by User.js pre-save hook)
        const managerUser = await User.create({
            name: 'Adithya Kolukulapally',
            email: 'adithya@stocksense.io',
            password: 'Password123!',
            role: 'inventory_manager'
        });

        const staffUser = await User.create({
            name: 'Warehouse Operator',
            email: 'staff@stocksense.io',
            password: 'Password123!',
            role: 'warehouse_staff'
        });

        console.log('👤 Users created');

        // 2. Categories
        const catRaw = await Category.create({ name: 'Raw Materials', description: 'Metals, plastics, and foundational supplies' });
        const catElectronics = await Category.create({ name: 'Electronics', description: 'Components, boards, and sensors' });
        const catHardware = await Category.create({ name: 'Hardware & Fasteners', description: 'Nuts, bolts, and brackets' });
        const catPackaging = await Category.create({ name: 'Packaging', description: 'Boxes, tape, and protective wraps' });

        console.log('🏷️ Categories created');

        // 3. Warehouses
        const whMain = await Warehouse.create({
            name: 'Main Central Warehouse',
            code: 'WH-MAIN',
            address: 'Industrial Zone Block 4, Logistics Blvd'
        });

        const whProd = await Warehouse.create({
            name: 'Production Facility Warehouse',
            code: 'WH-PROD',
            address: 'Factory Unit B, Manufacturing Ave'
        });

        const whDist = await Warehouse.create({
            name: 'Distribution Hub 2',
            code: 'WH-DIST',
            address: 'Cargo Bay 12, Terminal Road'
        });

        console.log('🏭 Warehouses created');

        // 4. Locations
        const locRackA = await Location.create({ warehouseId: whMain._id, name: 'Rack A (Heavy Metal)', code: 'RACK-A' });
        const locRackB = await Location.create({ warehouseId: whMain._id, name: 'Rack B (Electronics Shelf)', code: 'RACK-B' });
        const locStorage = await Location.create({ warehouseId: whMain._id, name: 'General Storage Area', code: 'STOR-1' });

        const locProdFloor = await Location.create({ warehouseId: whProd._id, name: 'Assembly Production Floor', code: 'PROD-FLR' });
        const locProdHold = await Location.create({ warehouseId: whProd._id, name: 'Holding Bay', code: 'HOLD-BAY' });

        const locDistDock = await Location.create({ warehouseId: whDist._id, name: 'Shipping Dock A', code: 'DOCK-A' });

        console.log('📍 Locations created');

        // 5. Products
        const prodSteel = await Product.create({
            name: 'Steel Rods 12mm',
            sku: 'STEEL-001',
            categoryId: catRaw._id,
            unitOfMeasure: 'Units',
            description: 'High tensile 12mm steel rebar rods 3m length',
            reorderLevel: 25,
            reorderQuantity: 100
        });

        const prodAlum = await Product.create({
            name: 'Aluminum Sheets 2mm',
            sku: 'ALUM-002',
            categoryId: catRaw._id,
            unitOfMeasure: 'Sheets',
            description: 'Grade 6061 anodized aluminum sheets',
            reorderLevel: 15,
            reorderQuantity: 50
        });

        const prodMcu = await Product.create({
            name: 'Microcontroller ESP32-WROOM',
            sku: 'MCU-ESP32',
            categoryId: catElectronics._id,
            unitOfMeasure: 'Units',
            description: 'Dual core Wi-Fi + BLE module',
            reorderLevel: 50,
            reorderQuantity: 200
        });

        const prodBolts = await Product.create({
            name: 'Hex Bolts M8 x 40mm',
            sku: 'BOLT-M8-40',
            categoryId: catHardware._id,
            unitOfMeasure: 'Boxes',
            description: 'Stainless steel grade 304 hex head bolts (100 pcs/box)',
            reorderLevel: 10,
            reorderQuantity: 40
        });

        const prodBoxes = await Product.create({
            name: 'Cardboard Shipping Box L',
            sku: 'BOX-CORR-L',
            categoryId: catPackaging._id,
            unitOfMeasure: 'Packs',
            description: 'Heavy duty double-wall corrugated carton (25/pack)',
            reorderLevel: 20,
            reorderQuantity: 60
        });

        const prodOutStock = await Product.create({
            name: 'Industrial Epoxy Adhesive 500ml',
            sku: 'EPOXY-IND-500',
            categoryId: catRaw._id,
            unitOfMeasure: 'Bottles',
            description: 'High strength two-component epoxy adhesive',
            reorderLevel: 15,
            reorderQuantity: 30
        });

        console.log('📦 Products created');

        // 6. Inventories & Initial Ledgers
        const inventorySetups = [
            { product: prodSteel, wh: whMain, loc: locRackA, qty: 120 },
            { product: prodAlum, wh: whMain, loc: locRackA, qty: 8 }, // Low stock (reorderLevel = 15)
            { product: prodMcu, wh: whMain, loc: locRackB, qty: 350 },
            { product: prodBolts, wh: whMain, loc: locStorage, qty: 45 },
            { product: prodBoxes, wh: whMain, loc: locStorage, qty: 12 }, // Low stock (reorderLevel = 20)
            { product: prodSteel, wh: whProd, loc: locProdFloor, qty: 40 }
            // prodOutStock has 0 stock (Out of stock item)
        ];

        for (const item of inventorySetups) {
            await Inventory.create({
                productId: item.product._id,
                warehouseId: item.wh._id,
                locationId: item.loc._id,
                quantity: item.qty
            });

            await StockLedger.create({
                productId: item.product._id,
                warehouseId: item.wh._id,
                locationId: item.loc._id,
                operationType: 'INITIAL_STOCK',
                referenceId: item.product._id,
                referenceNumber: `INIT-${item.product.sku}`,
                quantityBefore: 0,
                quantityChange: item.qty,
                quantityAfter: item.qty,
                createdBy: managerUser._id,
                createdByName: managerUser.name
            });
        }

        console.log('📊 Inventory and Initial Stock Ledgers recorded');

        // 7. Receipts
        const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        
        // Receipt 1: Done
        const rec1 = await Receipt.create({
            receiptNumber: `REC-${todayStr}-0001`,
            supplier: 'Apex Metal Forgings Ltd',
            warehouseId: whMain._id,
            locationId: locRackA._id,
            status: 'Done',
            items: [
                { productId: prodSteel._id, quantity: 50, unitOfMeasure: 'Units' }
            ],
            notes: 'Scheduled monthly shipment of steel stocks',
            createdBy: managerUser._id,
            validatedBy: staffUser._id,
            validatedAt: new Date(Date.now() - 3600000 * 4)
        });

        await StockLedger.create({
            productId: prodSteel._id,
            warehouseId: whMain._id,
            locationId: locRackA._id,
            operationType: 'RECEIPT',
            referenceId: rec1._id,
            referenceNumber: rec1.receiptNumber,
            quantityBefore: 70,
            quantityChange: 50,
            quantityAfter: 120,
            createdBy: staffUser._id,
            createdByName: staffUser.name,
            createdAt: new Date(Date.now() - 3600000 * 4)
        });

        // Receipt 2: Ready (pending)
        await Receipt.create({
            receiptNumber: `REC-${todayStr}-0002`,
            supplier: 'Silicon Dynamics Global',
            warehouseId: whMain._id,
            locationId: locRackB._id,
            status: 'Ready',
            items: [
                { productId: prodMcu._id, quantity: 100, unitOfMeasure: 'Units' }
            ],
            notes: 'Awaiting truck dock arrival',
            createdBy: managerUser._id
        });

        // Receipt 3: Waiting
        await Receipt.create({
            receiptNumber: `REC-${todayStr}-0003`,
            supplier: 'National Fasteners Corp',
            warehouseId: whMain._id,
            locationId: locStorage._id,
            status: 'Waiting',
            items: [
                { productId: prodBolts._id, quantity: 20, unitOfMeasure: 'Boxes' }
            ],
            notes: 'Purchase order PO-9982',
            createdBy: managerUser._id
        });

        console.log('📥 Receipts created');

        // 8. Deliveries
        // Delivery 1: Done
        const del1 = await Delivery.create({
            deliveryNumber: `DEL-${todayStr}-0001`,
            customer: 'Tesla Gigafactory Build Team',
            warehouseId: whMain._id,
            locationId: locRackA._id,
            status: 'Done',
            items: [
                { productId: prodSteel._id, quantity: 15 }
            ],
            shippingAddress: 'Gate 7, Electric Way',
            createdBy: managerUser._id,
            validatedBy: staffUser._id,
            validatedAt: new Date(Date.now() - 3600000 * 2)
        });

        await StockLedger.create({
            productId: prodSteel._id,
            warehouseId: whMain._id,
            locationId: locRackA._id,
            operationType: 'DELIVERY',
            referenceId: del1._id,
            referenceNumber: del1.deliveryNumber,
            quantityBefore: 135,
            quantityChange: -15,
            quantityAfter: 120,
            createdBy: staffUser._id,
            createdByName: staffUser.name,
            createdAt: new Date(Date.now() - 3600000 * 2)
        });

        // Delivery 2: Ready (pending)
        await Delivery.create({
            deliveryNumber: `DEL-${todayStr}-0002`,
            customer: 'Apex Robotics Inc',
            warehouseId: whMain._id,
            locationId: locRackB._id,
            status: 'Ready',
            items: [
                { productId: prodMcu._id, quantity: 25 }
            ],
            shippingAddress: 'Building 3, Silicon Valley',
            createdBy: managerUser._id
        });

        console.log('📤 Deliveries created');

        // 9. Internal Transfer
        // Transfer 1: Done
        const tr1 = await InternalTransfer.create({
            transferNumber: `TR-${todayStr}-0001`,
            sourceWarehouseId: whMain._id,
            sourceLocationId: locRackA._id,
            destinationWarehouseId: whProd._id,
            destinationLocationId: locProdFloor._id,
            status: 'Done',
            items: [
                { productId: prodSteel._id, quantity: 30 }
            ],
            reason: 'Production line re-stocking',
            createdBy: managerUser._id,
            validatedBy: staffUser._id,
            validatedAt: new Date(Date.now() - 3600000 * 3)
        });

        await StockLedger.create({
            productId: prodSteel._id,
            warehouseId: whMain._id,
            locationId: locRackA._id,
            operationType: 'TRANSFER_OUT',
            referenceId: tr1._id,
            referenceNumber: tr1.transferNumber,
            quantityBefore: 150,
            quantityChange: -30,
            quantityAfter: 120,
            createdBy: staffUser._id,
            createdByName: staffUser.name,
            createdAt: new Date(Date.now() - 3600000 * 3)
        });

        await StockLedger.create({
            productId: prodSteel._id,
            warehouseId: whProd._id,
            locationId: locProdFloor._id,
            operationType: 'TRANSFER_IN',
            referenceId: tr1._id,
            referenceNumber: tr1.transferNumber,
            quantityBefore: 10,
            quantityChange: 30,
            quantityAfter: 40,
            createdBy: staffUser._id,
            createdByName: staffUser.name,
            createdAt: new Date(Date.now() - 3600000 * 3)
        });

        // Transfer 2: Ready (pending)
        await InternalTransfer.create({
            transferNumber: `TR-${todayStr}-0002`,
            sourceWarehouseId: whMain._id,
            sourceLocationId: locStorage._id,
            destinationWarehouseId: whDist._id,
            destinationLocationId: locDistDock._id,
            status: 'Ready',
            items: [
                { productId: prodBoxes._id, quantity: 5 }
            ],
            reason: 'Staging boxes for distribution dock',
            createdBy: staffUser._id
        });

        console.log('🔄 Transfers created');

        // 10. Stock Adjustment
        const adj1 = await StockAdjustment.create({
            adjustmentNumber: `ADJ-${todayStr}-0001`,
            productId: prodAlum._id,
            warehouseId: whMain._id,
            locationId: locRackA._id,
            systemQuantity: 11,
            countedQuantity: 8,
            difference: -3,
            reason: 'Physical cycle count revealed 3 bent sheets written off as scrap',
            status: 'Done',
            createdBy: staffUser._id
        });

        await StockLedger.create({
            productId: prodAlum._id,
            warehouseId: whMain._id,
            locationId: locRackA._id,
            operationType: 'ADJUSTMENT',
            referenceId: adj1._id,
            referenceNumber: adj1.adjustmentNumber,
            quantityBefore: 11,
            quantityChange: -3,
            quantityAfter: 8,
            createdBy: staffUser._id,
            createdByName: staffUser.name
        });

        console.log('⚖️ Stock Adjustments created');

        console.log('✨ Seed completed successfully!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error during seeding:', err);
        process.exit(1);
    }
};

seed();
