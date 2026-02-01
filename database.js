let db = null;
let SQL = null;

// تهيئة قاعدة البيانات
async function initDatabase() {
    try {
        SQL = await initSqlJs({
            locateFile: file => `https://cdn.jsdelivr.net/npm/sql.js@1.8.0/dist/${file}`
        });
        
        // محاولة تحميل قاعدة البيانات المحفوظة
        const savedDb = localStorage.getItem('realEstateDb');
        
        if (savedDb) {
            const uint8Array = new Uint8Array(JSON.parse(savedDb));
            db = new SQL.Database(uint8Array);
            // تحديث الجداول لإضافة الأعمدة الجديدة
            updateTables();
        } else {
            db = new SQL.Database();
            createTables();
        }
        
        console.log('Database initialized successfully');
        return true;
    } catch (error) {
        console.error('Error initializing database:', error);
        return false;
    }
}

// إنشاء الجداول
function createTables() {
    // جدول المنازل
    db.run(`
        CREATE TABLE IF NOT EXISTS houses (
            id INTEGER PRIMARY KEY,
            house_number INTEGER NOT NULL UNIQUE,
            block_number INTEGER NOT NULL,
            total_area REAL NOT NULL,
            building_area REAL NOT NULL,
            total_price REAL NOT NULL,
            down_payment REAL DEFAULT 0,
            loan_amount REAL DEFAULT 0,
            phase INTEGER NOT NULL DEFAULT 1,
            outlook TEXT,
            additional_specs TEXT,
            status TEXT DEFAULT 'available',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // جدول الوصولات
    db.run(`
        CREATE TABLE IF NOT EXISTS receipts (
            id INTEGER PRIMARY KEY,
            receipt_number INTEGER NOT NULL UNIQUE,
            receipt_date DATE NOT NULL,
            buyer_name TEXT NOT NULL,
            mobile_number TEXT NOT NULL,
            unit_number INTEGER NOT NULL,
            block_number INTEGER NOT NULL,
            unit_area REAL NOT NULL,
            amount_received REAL NOT NULL,
            remaining_amount REAL NOT NULL,
            due_date DATE,
            notes TEXT,
            house_id INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (house_id) REFERENCES houses(id)
        )
    `);

    // جدول العقود
    db.run(`
        CREATE TABLE IF NOT EXISTS contracts (
            id INTEGER PRIMARY KEY,
            sale_date DATE NOT NULL,
            house_number INTEGER NOT NULL,
            block_number INTEGER NOT NULL,
            area REAL NOT NULL,
            floors INTEGER NOT NULL,
            buyer_name TEXT NOT NULL,
            mobile_number TEXT NOT NULL,
            sale_type TEXT NOT NULL,
            total_amount REAL NOT NULL,
            down_payment REAL NOT NULL,
            loan_amount REAL NOT NULL,
            amount_paid REAL NOT NULL,
            contract_date DATE NOT NULL,
            contract_number INTEGER NOT NULL UNIQUE,
            buyer_signature TEXT DEFAULT 'بالانتظار',
            investor_signature TEXT DEFAULT 'بالانتظار',
            contract_receipt TEXT DEFAULT 'بالانتظار',
            house_id INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (house_id) REFERENCES houses(id)
        )
    `);

    // جدول إعادة البيع
    db.run(`
        CREATE TABLE IF NOT EXISTS resale (
            id INTEGER PRIMARY KEY,
            house_id INTEGER NOT NULL,
            source TEXT NOT NULL,
            mobile_number TEXT NOT NULL,
            contact_date DATE NOT NULL,
            remaining_amount REAL,
            floors INTEGER,
            building_material TEXT,
            additional_specs TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (house_id) REFERENCES houses(id)
        )
    `);

    // جدول المدفوعات
    db.run(`
        CREATE TABLE IF NOT EXISTS payments (
            id INTEGER PRIMARY KEY,
            contract_id INTEGER NOT NULL,
            payment_date DATE NOT NULL,
            amount REAL NOT NULL,
            payment_type TEXT,
            notes TEXT,
            next_payment_due_date DATE,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (contract_id) REFERENCES contracts(id)
        )
    `);
    
    // إضافة حقل next_payment_due_date للعقود إذا لم يكن موجوداً
    try {
        db.run(`ALTER TABLE contracts ADD COLUMN next_payment_due_date DATE`);
    } catch (e) {
        // الحقل موجود بالفعل
    }
    
    // إضافة حقول floors و building_material إلى جدول houses إذا لم تكن موجودة
    try {
        db.run(`ALTER TABLE houses ADD COLUMN floors INTEGER`);
    } catch (e) {
        // الحقل موجود بالفعل
    }
    try {
        db.run(`ALTER TABLE houses ADD COLUMN building_material TEXT`);
    } catch (e) {
        // الحقل موجود بالفعل
    }
    
    // إضافة حقول floors و building_material إلى جدول resale إذا لم تكن موجودة
    try {
        db.run(`ALTER TABLE resale ADD COLUMN floors INTEGER`);
    } catch (e) {
        // الحقل موجود بالفعل
    }
    try {
        db.run(`ALTER TABLE resale ADD COLUMN building_material TEXT`);
    } catch (e) {
        // الحقل موجود بالفعل
    }

    saveDatabase();
}

// تحديث الجداول لإضافة الأعمدة الجديدة
function updateTables() {
    // إضافة حقل next_payment_due_date للعقود إذا لم يكن موجوداً
    try {
        db.run(`ALTER TABLE contracts ADD COLUMN next_payment_due_date DATE`);
    } catch (e) {
        // الحقل موجود بالفعل
    }
    
    // إضافة حقول floors و building_material إلى جدول houses إذا لم تكن موجودة
    try {
        db.run(`ALTER TABLE houses ADD COLUMN floors INTEGER`);
    } catch (e) {
        // الحقل موجود بالفعل
    }
    try {
        db.run(`ALTER TABLE houses ADD COLUMN building_material TEXT`);
    } catch (e) {
        // الحقل موجود بالفعل
    }
    
    // إضافة حقول floors و building_material إلى جدول resale إذا لم تكن موجودة
    try {
        db.run(`ALTER TABLE resale ADD COLUMN floors INTEGER`);
    } catch (e) {
        // الحقل موجود بالفعل
    }
    try {
        db.run(`ALTER TABLE resale ADD COLUMN building_material TEXT`);
    } catch (e) {
        // الحقل موجود بالفعل
    }
    
    saveDatabase();
}

// حفظ قاعدة البيانات
function saveDatabase() {
    try {
        const data = db.export();
        const buffer = Array.from(data);
        localStorage.setItem('realEstateDb', JSON.stringify(buffer));
    } catch (error) {
        console.error('Error saving database:', error);
    }
}

// إضافة دار جديدة
function addHouse(houseData) {
    try {
        // الحصول على آخر ID
        const lastIdResult = db.exec("SELECT COALESCE(MAX(id), 0) + 1 as next_id FROM houses");
        const nextId = lastIdResult.length > 0 ? lastIdResult[0].values[0][0] : 1;
        
        db.run(`
            INSERT INTO houses (
                id, house_number, block_number, total_area, building_area,
                total_price, down_payment, loan_amount, phase,
                outlook, additional_specs, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'available')
        `, [
            nextId,
            houseData.houseNumber,
            houseData.blockNumber,
            houseData.totalArea,
            houseData.buildingArea,
            houseData.totalPrice,
            houseData.downPayment || 0,
            houseData.loanAmount || 0,
            houseData.phase,
            houseData.outlook || 0,
            houseData.additionalSpecs || ''
        ]);
        saveDatabase();
        return { success: true, id: nextId };
    } catch (error) {
        console.error('Error adding house:', error);
        return { success: false, error: error.message };
    }
}

// إضافة منازل متعددة للاختبار
function addMultipleHouses(count = 100) {
    try {
        // الحصول على آخر house_number
        const lastHouseNumberResult = db.exec("SELECT COALESCE(MAX(house_number), 0) as last_number FROM houses");
        let lastHouseNumber = lastHouseNumberResult.length > 0 && lastHouseNumberResult[0].values.length > 0 
            ? lastHouseNumberResult[0].values[0][0] : 0;
        
        const phases = [1, 2, 3, 4, 5];
        const blocks = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
        
        let added = 0;
        let errors = 0;
        
        for (let i = 0; i < count; i++) {
            lastHouseNumber++;
            
            // بيانات عشوائية واقعية
            const blockNumber = blocks[Math.floor(Math.random() * blocks.length)];
            const phase = phases[Math.floor(Math.random() * phases.length)];
            const totalArea = Math.floor(Math.random() * 100) + 150; // بين 150 و 250 م²
            const buildingArea = Math.floor(totalArea * (0.7 + Math.random() * 0.2)); // 70-90% من المساحة الكلية
            const totalPrice = Math.floor(totalArea * (800000 + Math.random() * 400000)); // بين 800,000 و 1,200,000 دينار للمتر
            const downPayment = Math.floor(totalPrice * (0.15 + Math.random() * 0.15)); // بين 15% و 30%
            const loanAmount = totalPrice - downPayment;
            // التطلوعة كمبلغ مالي (30% من المنازل لديها تطلوعة بين 500,000 و 2,000,000 دينار)
            const outlook = Math.random() > 0.7 ? Math.floor(Math.random() * 1500000) + 500000 : 0;
            const additionalSpecs = Math.random() > 0.7 ? 'مواصفات خاصة' : '';
            
            try {
                const lastIdResult = db.exec("SELECT COALESCE(MAX(id), 0) + 1 as next_id FROM houses");
                const nextId = lastIdResult.length > 0 ? lastIdResult[0].values[0][0] : 1;
                
                db.run(`
                    INSERT INTO houses (
                        id, house_number, block_number, total_area, building_area,
                        total_price, down_payment, loan_amount, phase,
                        outlook, additional_specs, status
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'available')
                `, [
                    nextId,
                    lastHouseNumber,
                    blockNumber,
                    totalArea,
                    buildingArea,
                    totalPrice,
                    downPayment,
                    loanAmount,
                    phase,
                    outlook,
                    additionalSpecs
                ]);
                added++;
            } catch (err) {
                console.error(`Error adding house ${lastHouseNumber}:`, err);
                errors++;
            }
        }
        
        saveDatabase();
        return { 
            success: true, 
            added: added, 
            errors: errors,
            message: `تم إضافة ${added} منزل بنجاح${errors > 0 ? ` مع ${errors} أخطاء` : ''}`
        };
    } catch (error) {
        console.error('Error adding multiple houses:', error);
        return { success: false, error: error.message };
    }
}

// الحصول على جميع المنازل
function getAllHouses(filterPhase = 'all', includeSold = true) {
    try {
        if (!db) {
            console.error('Database not initialized');
            return [];
        }
        let query = "SELECT * FROM houses WHERE 1=1";
        if (!includeSold) {
            query += " AND status = 'available'";
        }
        if (filterPhase !== 'all') {
            query += ` AND phase = ${filterPhase}`;
        }
        query += " ORDER BY house_number";
        const result = db.exec(query);
        if (result.length === 0) return [];
        return result[0].values.map(row => {
            const columns = result[0].columns;
            const obj = {};
            columns.forEach((col, idx) => {
                obj[col] = row[idx];
            });
            return obj;
        });
    } catch (error) {
        console.error('Error getting houses:', error);
        return [];
    }
}

// الحصول على دار بواسطة ID
function getHouseById(id) {
    try {
        if (!db) {
            console.error('Database not initialized');
            return null;
        }
        const result = db.exec(`SELECT * FROM houses WHERE id = ${id}`);
        if (result.length === 0) return null;
        const row = result[0].values[0];
        const columns = result[0].columns;
        const obj = {};
        columns.forEach((col, idx) => {
            obj[col] = row[idx];
        });
        return obj;
    } catch (error) {
        console.error('Error getting house:', error);
        return null;
    }
}

// تحديث حالة الدار
function updateHouseStatus(houseId, status) {
    try {
        db.run(`UPDATE houses SET status = '${status}' WHERE id = ${houseId}`);
        saveDatabase();
        return { success: true };
    } catch (error) {
        console.error('Error updating house status:', error);
        return { success: false, error: error.message };
    }
}

// تحديث بيانات دار قائمة
function updateHouse(id, houseData) {
    try {
        db.run(`
            UPDATE houses SET
                house_number = ?,
                block_number = ?,
                total_area = ?,
                building_area = ?,
                total_price = ?,
                down_payment = ?,
                loan_amount = ?,
                phase = ?,
                outlook = ?,
                additional_specs = ?
            WHERE id = ?
        `, [
            houseData.houseNumber,
            houseData.blockNumber,
            houseData.totalArea,
            houseData.buildingArea,
            houseData.totalPrice,
            houseData.downPayment || 0,
            houseData.loanAmount || 0,
            houseData.phase,
            houseData.outlook || 0,
            houseData.additionalSpecs || '',
            id
        ]);
        saveDatabase();
        return { success: true };
    } catch (error) {
        console.error('Error updating house:', error);
        return { success: false, error: error.message };
    }
}

// إضافة وصل
function addReceipt(receiptData) {
    try {
        const lastIdResult = db.exec("SELECT COALESCE(MAX(id), 0) + 1 as next_id FROM receipts");
        const nextId = lastIdResult.length > 0 ? lastIdResult[0].values[0][0] : 1;
        
        db.run(`
            INSERT INTO receipts (
                id, receipt_number, receipt_date, buyer_name, mobile_number,
                unit_number, block_number, unit_area, amount_received,
                remaining_amount, due_date, notes, house_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            nextId,
            receiptData.receiptNumber,
            receiptData.receiptDate,
            receiptData.buyerName,
            receiptData.mobileNumber,
            receiptData.unitNumber,
            receiptData.blockNumber,
            receiptData.unitArea,
            receiptData.amountReceived,
            receiptData.remainingAmount,
            receiptData.dueDate || null,
            receiptData.notes || '',
            receiptData.houseId || null
        ]);
        
        // تحديث حالة الدار إلى مباعة عند إصدار وصل
        if (receiptData.houseId) {
            updateHouseStatus(receiptData.houseId, 'sold');
            
            // إنشاء عقد تلقائياً عند إصدار وصل
            const house = getHouseById(receiptData.houseId);
            if (house) {
                // حساب المبلغ الكلي
                const totalAmount = receiptData.amountReceived + receiptData.remainingAmount;
                
                // الحصول على رقم العقد التالي
                const contractNumberResult = db.exec("SELECT COALESCE(MAX(contract_number), 0) + 1 as next_contract_number FROM contracts");
                const nextContractNumber = contractNumberResult.length > 0 ? contractNumberResult[0].values[0][0] : 1;
                
                // إنشاء بيانات العقد
                const contractData = {
                    saleDate: receiptData.receiptDate,
                    houseNumber: receiptData.unitNumber,
                    blockNumber: receiptData.blockNumber,
                    area: receiptData.unitArea,
                    floors: 1, // قيمة افتراضية
                    buyerName: receiptData.buyerName,
                    mobileNumber: receiptData.mobileNumber,
                    saleType: 'بيع أول مرة',
                    totalAmount: house.total_price || totalAmount,
                    downPayment: receiptData.amountReceived,
                    loanAmount: house.loan_amount || receiptData.remainingAmount,
                    amountPaid: receiptData.amountReceived,
                    contractDate: receiptData.receiptDate,
                    contractNumber: nextContractNumber,
                    buyerSignature: 'بالانتظار',
                    investorSignature: 'بالانتظار',
                    contractReceipt: 'بالانتظار'
                };
                
                // إضافة العقد
                addContract(contractData);
            }
        }
        
        saveDatabase();
        return { success: true };
    } catch (error) {
        console.error('Error adding receipt:', error);
        return { success: false, error: error.message };
    }
}

// الحصول على جميع الوصولات
function getAllReceipts() {
    try {
        if (!db) {
            console.error('Database not initialized');
            return [];
        }
        const result = db.exec("SELECT * FROM receipts ORDER BY receipt_date DESC, receipt_number DESC");
        if (result.length === 0) return [];
        return result[0].values.map(row => {
            const columns = result[0].columns;
            const obj = {};
            columns.forEach((col, idx) => {
                obj[col] = row[idx];
            });
            return obj;
        });
    } catch (error) {
        console.error('Error getting receipts:', error);
        return [];
    }
}

// الحصول على وصل بواسطة ID
function getReceiptById(id) {
    try {
        if (!db) {
            console.error('Database not initialized');
            return null;
        }
        const result = db.exec(`SELECT * FROM receipts WHERE id = ${id}`);
        if (result.length === 0) return null;
        const row = result[0].values[0];
        const columns = result[0].columns;
        const obj = {};
        columns.forEach((col, idx) => {
            obj[col] = row[idx];
        });
        return obj;
    } catch (error) {
        console.error('Error getting receipt:', error);
        return null;
    }
}

// حذف وصل
function deleteReceipt(receiptId) {
    try {
        if (!db) {
            console.error('Database not initialized');
            return { success: false, error: 'قاعدة البيانات غير مهيأة' };
        }
        
        // الحصول على بيانات الوصل قبل الحذف
        const receipt = getReceiptById(receiptId);
        if (!receipt) {
            return { success: false, error: 'الوصول غير موجود' };
        }
        
        const houseId = receipt.house_id;
        const houseNumber = receipt.unit_number;
        const buyerName = receipt.buyer_name;
        const mobileNumber = receipt.mobile_number;
        
        // البحث عن العقد المرتبط بالوصول
        // نبحث عن عقد له نفس house_id أو نفس house_number و buyer_name و mobile_number
        let contractId = null;
        if (houseId) {
            const contractResult = db.exec(`
                SELECT id FROM contracts 
                WHERE house_id = ${houseId} 
                AND buyer_name = '${buyerName.replace(/'/g, "''")}' 
                AND mobile_number = '${mobileNumber.replace(/'/g, "''")}'
                LIMIT 1
            `);
            if (contractResult.length > 0 && contractResult[0].values.length > 0) {
                contractId = contractResult[0].values[0][0];
            }
        }
        
        // إذا لم نجد عقد من خلال house_id، نبحث من خلال house_number
        if (!contractId && houseNumber) {
            const contractResult = db.exec(`
                SELECT id FROM contracts 
                WHERE house_number = ${houseNumber} 
                AND buyer_name = '${buyerName.replace(/'/g, "''")}' 
                AND mobile_number = '${mobileNumber.replace(/'/g, "''")}'
                LIMIT 1
            `);
            if (contractResult.length > 0 && contractResult[0].values.length > 0) {
                contractId = contractResult[0].values[0][0];
            }
        }
        
        // حذف المدفوعات المرتبطة بالعقد (إن وجد)
        if (contractId) {
            db.run(`DELETE FROM payments WHERE contract_id = ?`, [contractId]);
        }
        
        // حذف العقد (إن وجد)
        if (contractId) {
            db.run(`DELETE FROM contracts WHERE id = ?`, [contractId]);
        }
        
        // حذف الوصل
        db.run(`DELETE FROM receipts WHERE id = ?`, [receiptId]);
        
        // تحديث حالة المنزل من "مباع" إلى "متوفر" إذا كان مرتبطاً بمنزل
        if (houseId) {
            // التحقق من وجود عقود أخرى مرتبطة بنفس المنزل
            const otherContractsResult = db.exec(`
                SELECT COUNT(*) as count FROM contracts WHERE house_id = ${houseId}
            `);
            const otherContractsCount = otherContractsResult.length > 0 && otherContractsResult[0].values.length > 0
                ? otherContractsResult[0].values[0][0] : 0;
            
            // إذا لم تكن هناك عقود أخرى، نعيد المنزل إلى حالة "متوفر"
            if (otherContractsCount === 0) {
                updateHouseStatus(houseId, 'available');
            }
        }
        
        saveDatabase();
        return { success: true };
    } catch (error) {
        console.error('Error deleting receipt:', error);
        return { success: false, error: error.message };
    }
}

// إضافة عقد
function addContract(contractData) {
    try {
        // البحث عن house_id من house_number
        let houseId = null;
        if (contractData.houseNumber) {
            const houseResult = db.exec(`SELECT id FROM houses WHERE house_number = ${contractData.houseNumber}`);
            if (houseResult.length > 0 && houseResult[0].values.length > 0) {
                houseId = houseResult[0].values[0][0];
                // تحديث حالة الدار إلى مباع
                updateHouseStatus(houseId, 'sold');
            }
        }

        const lastIdResult = db.exec("SELECT COALESCE(MAX(id), 0) + 1 as next_id FROM contracts");
        const nextId = lastIdResult.length > 0 ? lastIdResult[0].values[0][0] : 1;

        db.run(`
            INSERT INTO contracts (
                id, sale_date, house_number, block_number, area, floors,
                buyer_name, mobile_number, sale_type, total_amount,
                down_payment, loan_amount, amount_paid, contract_date,
                contract_number, buyer_signature, investor_signature,
                contract_receipt, house_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            nextId,
            contractData.saleDate,
            contractData.houseNumber,
            contractData.blockNumber,
            contractData.area,
            contractData.floors,
            contractData.buyerName,
            contractData.mobileNumber,
            contractData.saleType,
            contractData.totalAmount,
            contractData.downPayment,
            contractData.loanAmount,
            contractData.amountPaid,
            contractData.contractDate,
            contractData.contractNumber,
            contractData.buyerSignature || 'بالانتظار',
            contractData.investorSignature || 'بالانتظار',
            contractData.contractReceipt || 'بالانتظار',
            houseId
        ]);
        saveDatabase();
        return { success: true };
    } catch (error) {
        console.error('Error adding contract:', error);
        return { success: false, error: error.message };
    }
}

// الحصول على عقد بواسطة ID
function getContractById(id) {
    try {
        if (!db) {
            console.error('Database not initialized');
            return null;
        }
        const result = db.exec(`SELECT * FROM contracts WHERE id = ${id}`);
        if (result.length === 0) return null;
        const row = result[0].values[0];
        const columns = result[0].columns;
        const obj = {};
        columns.forEach((col, idx) => {
            obj[col] = row[idx];
        });
        return obj;
    } catch (error) {
        console.error('Error getting contract:', error);
        return null;
    }
}

// تحديث عقد قائم
function updateContract(id, contractData) {
    try {
        const existingContract = getContractById(id);
        if (!existingContract) {
            return { success: false, error: 'Contract not found' };
        }

        // تحديد الدار المرتبطة بالعقد
        let newHouseId = null;
        if (contractData.houseNumber) {
            const houseResult = db.exec(`SELECT id FROM houses WHERE house_number = ${contractData.houseNumber}`);
            if (houseResult.length > 0 && houseResult[0].values.length > 0) {
                newHouseId = houseResult[0].values[0][0];
            } else {
                return { success: false, error: 'House not found' };
            }
        }

        // تحديث حالة الدار القديمة في حال تغيرت
        if (existingContract.house_id && existingContract.house_id !== newHouseId) {
            updateHouseStatus(existingContract.house_id, 'available');
        }
        if (newHouseId) {
            updateHouseStatus(newHouseId, 'sold');
        }

        db.run(`
            UPDATE contracts SET
                sale_date = ?,
                house_number = ?,
                block_number = ?,
                area = ?,
                floors = ?,
                buyer_name = ?,
                mobile_number = ?,
                sale_type = ?,
                total_amount = ?,
                down_payment = ?,
                loan_amount = ?,
                amount_paid = ?,
                contract_date = ?,
                contract_number = ?,
                buyer_signature = ?,
                investor_signature = ?,
                contract_receipt = ?,
                house_id = ?
            WHERE id = ?
        `, [
            contractData.saleDate,
            contractData.houseNumber,
            contractData.blockNumber,
            contractData.area,
            contractData.floors,
            contractData.buyerName,
            contractData.mobileNumber,
            contractData.saleType,
            contractData.totalAmount,
            contractData.downPayment,
            contractData.loanAmount,
            contractData.amountPaid,
            contractData.contractDate,
            contractData.contractNumber,
            contractData.buyerSignature || 'بالانتظار',
            contractData.investorSignature || 'بالانتظار',
            contractData.contractReceipt || 'بالانتظار',
            newHouseId,
            id
        ]);
        saveDatabase();
        return { success: true };
    } catch (error) {
        console.error('Error updating contract:', error);
        return { success: false, error: error.message };
    }
}

// الحصول على جميع العقود
function getAllContracts() {
    try {
        if (!db) {
            console.error('Database not initialized');
            return [];
        }
        const result = db.exec("SELECT * FROM contracts ORDER BY sale_date DESC");
        if (result.length === 0) return [];
        return result[0].values.map(row => {
            const columns = result[0].columns;
            const obj = {};
            columns.forEach((col, idx) => {
                obj[col] = row[idx];
            });
            return obj;
        });
    } catch (error) {
        console.error('Error getting contracts:', error);
        return [];
    }
}

// الحصول على المنازل المباعة
function getSoldHouses() {
    try {
        if (!db) {
            console.error('Database not initialized');
            return [];
        }
        // الحصول على جميع العقود مع house_id
        const contractsResult = db.exec(`
            SELECT house_id, buyer_name, contract_date, contract_number
            FROM contracts
            WHERE house_id IS NOT NULL
            ORDER BY contract_date DESC
        `);
        
        if (contractsResult.length === 0) {
            console.log('No contracts found');
            return [];
        }
        
        const soldHouses = [];
        const houseIds = new Set(); // لتجنب التكرار
        
        contractsResult[0].values.forEach(contractRow => {
            const houseId = contractRow[0];
            if (!houseId || houseIds.has(houseId)) return; // تخطي إذا كان فارغاً أو مكرراً
            
            houseIds.add(houseId);
            
            // جلب الدار - لا نتحقق من status لأن بعض المنازل قد لا تكون محدثة
            const houseResult = db.exec(`SELECT * FROM houses WHERE id = ${houseId}`);
            if (houseResult.length > 0 && houseResult[0].values.length > 0) {
                const houseRow = houseResult[0].values[0];
                const houseColumns = houseResult[0].columns;
                const houseObj = {};
                houseColumns.forEach((col, idx) => {
                    houseObj[col] = houseRow[idx];
                });
                houseObj.buyer_name = contractRow[1];
                houseObj.contract_date = contractRow[2];
                houseObj.contract_number = contractRow[3];
                soldHouses.push(houseObj);
            }
        });
        
        console.log('Found sold houses:', soldHouses.length);
        return soldHouses;
    } catch (error) {
        console.error('Error getting sold houses:', error);
        return [];
    }
}

// إضافة إعادة بيع
function addResale(resaleData) {
    try {
        if (!db) {
            console.error('Database not initialized');
            return { success: false, error: 'قاعدة البيانات غير مهيأة' };
        }
        
        if (!resaleData.houseId) {
            return { success: false, error: 'الرجاء اختيار دار' };
        }
        
        if (!resaleData.source || !resaleData.source.trim()) {
            return { success: false, error: 'الرجاء إدخال المصدر' };
        }
        
        if (!resaleData.mobileNumber || !resaleData.mobileNumber.trim()) {
            return { success: false, error: 'الرجاء إدخال رقم الموبايل' };
        }
        
        if (!resaleData.contactDate) {
            return { success: false, error: 'الرجاء إدخال تاريخ العرض' };
        }
        
        // التحقق من أن الدار موجودة
        const house = getHouseById(resaleData.houseId);
        if (!house) {
            return { success: false, error: 'الدار المحددة غير موجودة' };
        }
        
        const lastIdResult = db.exec("SELECT COALESCE(MAX(id), 0) + 1 as next_id FROM resale");
        const nextId = lastIdResult.length > 0 ? lastIdResult[0].values[0][0] : 1;
        
        db.run(`
            INSERT INTO resale (
                id, house_id, source, mobile_number, contact_date,
                remaining_amount, floors, building_material, additional_specs
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            nextId,
            resaleData.houseId,
            resaleData.source.trim(),
            resaleData.mobileNumber.trim(),
            resaleData.contactDate,
            resaleData.remainingAmount || null,
            resaleData.floors || null,
            resaleData.buildingMaterial || null,
            resaleData.additionalSpecs || ''
        ]);
        saveDatabase();
        console.log('Resale added successfully with ID:', nextId);
        return { success: true };
    } catch (error) {
        console.error('Error adding resale:', error);
        return { success: false, error: error.message };
    }
}

// الحصول على جميع إعادة البيع
function getAllResale() {
    try {
        if (!db) {
            console.error('Database not initialized');
            return [];
        }
        const resaleResult = db.exec("SELECT * FROM resale ORDER BY contact_date DESC");
        if (resaleResult.length === 0) return [];
        
        const resales = [];
        resaleResult[0].values.forEach(resaleRow => {
            const resaleColumns = resaleResult[0].columns;
            const resaleObj = {};
            resaleColumns.forEach((col, idx) => {
                resaleObj[col] = resaleRow[idx];
            });
            
            // الحصول على بيانات الدار
            const houseId = resaleRow[resaleColumns.indexOf('house_id')];
            const houseResult = db.exec(`SELECT house_number, block_number, phase, building_area, total_price, loan_amount, outlook, floors, building_material FROM houses WHERE id = ${houseId}`);
            if (houseResult.length > 0 && houseResult[0].values.length > 0) {
                const houseRow = houseResult[0].values[0];
                const houseColumns = houseResult[0].columns;
                houseColumns.forEach((col, idx) => {
                    resaleObj[col] = houseRow[idx];
                });
            }
            
            // إذا لم يكن floors و building_material في resale، جلبها من العقد المرتبط أو الدار
            if (!resaleObj.floors) {
                const contractResult = db.exec(`SELECT floors FROM contracts WHERE house_id = ${houseId} LIMIT 1`);
                if (contractResult.length > 0 && contractResult[0].values.length > 0) {
                    const floorsIndex = contractResult[0].columns.indexOf('floors');
                    if (floorsIndex >= 0) {
                        resaleObj.floors = contractResult[0].values[0][floorsIndex];
                    }
                }
            }
            
            if (!resaleObj.building_material) {
                // جلب مادة البناء من جدول houses
                const houseMaterialResult = db.exec(`SELECT building_material FROM houses WHERE id = ${houseId}`);
                if (houseMaterialResult.length > 0 && houseMaterialResult[0].values.length > 0) {
                    const materialIndex = houseMaterialResult[0].columns.indexOf('building_material');
                    if (materialIndex >= 0 && houseMaterialResult[0].values[0][materialIndex]) {
                        resaleObj.building_material = houseMaterialResult[0].values[0][materialIndex];
                    }
                }
            }
            
            resales.push(resaleObj);
        });
        
        return resales;
    } catch (error) {
        console.error('Error getting resale:', error);
        return [];
    }
}

// حذف إعادة بيع
function deleteResale(id) {
    try {
        db.run(`DELETE FROM resale WHERE id = ${id}`);
        saveDatabase();
        return { success: true };
    } catch (error) {
        console.error('Error deleting resale:', error);
        return { success: false, error: error.message };
    }
}

// إحصائيات
function getStatistics() {
    try {
        if (!db) {
            console.error('Database not initialized');
            return {
                totalSoldHouses: 0,
                monthlySoldHouses: 0,
                totalRevenue: 0,
                monthlyRevenue: 0,
                totalDebts: 0,
                phaseSales: {},
                monthlySalesData: []
            };
        }
        const stats = {};
        
        // إجمالي المنازل المباعة
        const totalSold = db.exec("SELECT COUNT(*) as count FROM contracts");
        stats.totalSoldHouses = totalSold.length > 0 ? totalSold[0].values[0][0] : 0;
        
        // المنازل المباعة هذا الشهر
        const currentMonth = new Date().toISOString().slice(0, 7);
        const monthlySold = db.exec(`
            SELECT COUNT(*) as count FROM contracts 
            WHERE substr(sale_date, 1, 7) = ?
        `);
        // Filter manually since SQL.js doesn't support parameterized queries well
        const allContracts = db.exec("SELECT sale_date FROM contracts");
        let monthlyCount = 0;
        if (allContracts.length > 0) {
            monthlyCount = allContracts[0].values.filter(row => {
                const dateStr = row[0];
                return dateStr && dateStr.toString().substring(0, 7) === currentMonth;
            }).length;
        }
        stats.monthlySoldHouses = monthlyCount;
        
        // إجمالي الإيرادات - فقط من المقدمة وإذا وجدت تطلوعة
        const contractsWithHousesForRevenue = db.exec(`
            SELECT c.down_payment, c.sale_date, h.outlook
            FROM contracts c
            LEFT JOIN houses h ON c.house_id = h.id
        `);
        let totalRev = 0;
        let monthlyRev = 0;
        if (contractsWithHousesForRevenue.length > 0) {
            contractsWithHousesForRevenue[0].values.forEach(row => {
                const downPayment = parseFloat(row[0]) || 0;
                const saleDate = row[1];
                const outlook = parseFloat(row[2]) || 0;
                
                // إضافة المقدمة
                totalRev += downPayment;
                
                // إذا وجدت تطلوعة (مبلغ مالي)، إضافة المبلغ
                if (outlook > 0) {
                    totalRev += outlook;
                }
                
                // حساب الإيرادات الشهرية
                if (saleDate && saleDate.toString().substring(0, 7) === currentMonth) {
                    monthlyRev += downPayment;
                    if (outlook > 0) {
                        monthlyRev += outlook;
                    }
                }
            });
        }
        stats.totalRevenue = totalRev;
        stats.monthlyRevenue = monthlyRev;
        
        // المبيعات حسب المرحلة
        const contractsWithHouses = db.exec(`
            SELECT c.house_id, h.phase
            FROM contracts c
            INNER JOIN houses h ON c.house_id = h.id
        `);
        stats.phaseSales = {};
        if (contractsWithHouses.length > 0) {
            contractsWithHouses[0].values.forEach(row => {
                const phase = row[1];
                stats.phaseSales[phase] = (stats.phaseSales[phase] || 0) + 1;
            });
        }
        
        // المبيعات الشهرية (آخر 6 أشهر)
        const allContractsForMonthly = db.exec("SELECT sale_date FROM contracts");
        const monthlyMap = {};
        if (allContractsForMonthly.length > 0) {
            const sixMonthsAgo = new Date();
            sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
            
            allContractsForMonthly[0].values.forEach(row => {
                const dateStr = row[0];
                if (dateStr) {
                    const date = new Date(dateStr);
                    if (date >= sixMonthsAgo) {
                        const monthKey = date.toISOString().substring(0, 7);
                        monthlyMap[monthKey] = (monthlyMap[monthKey] || 0) + 1;
                    }
                }
            });
        }
        stats.monthlySalesData = Object.keys(monthlyMap).sort().map(month => ({
            month: month,
            count: monthlyMap[month]
        }));
        
        // حساب مجموع الديون (المبلغ المتبقي من جميع العقود)
        const contractsForDebts = db.exec("SELECT id FROM contracts");
        let totalDebts = 0;
        if (contractsForDebts.length > 0) {
            contractsForDebts[0].values.forEach(row => {
                const contractId = row[0];
                const remaining = getRemainingAmount(contractId);
                totalDebts += remaining;
            });
        }
        stats.totalDebts = totalDebts;
        
        return stats;
    } catch (error) {
        console.error('Error getting statistics:', error);
        return {
            totalSoldHouses: 0,
            monthlySoldHouses: 0,
            totalRevenue: 0,
            totalDebts: 0,
            monthlyRevenue: 0,
            phaseSales: {},
            monthlySalesData: []
        };
    }
}

// إضافة دفعة جديدة
function addPayment(paymentData) {
    try {
        const lastIdResult = db.exec("SELECT COALESCE(MAX(id), 0) + 1 as next_id FROM payments");
        const nextId = lastIdResult.length > 0 ? lastIdResult[0].values[0][0] : 1;
        
        db.run(`
            INSERT INTO payments (
                id, contract_id, payment_date, amount, payment_type, notes
            ) VALUES (?, ?, ?, ?, ?, ?)
        `, [
            nextId,
            paymentData.contractId,
            paymentData.paymentDate,
            paymentData.amount,
            paymentData.paymentType || 'دفعة',
            paymentData.notes || ''
        ]);
        
        // تحديث المبلغ المدفوع في العقد
        const contract = getContractById(paymentData.contractId);
        if (contract) {
            const newAmountPaid = (contract.amount_paid || 0) + paymentData.amount;
            db.run(`UPDATE contracts SET amount_paid = ? WHERE id = ?`, [newAmountPaid, paymentData.contractId]);
        }
        
        saveDatabase();
        return { success: true, id: nextId };
    } catch (error) {
        console.error('Error adding payment:', error);
        return { success: false, error: error.message };
    }
}

// الحصول على جميع المدفوعات لعقد معين
function getPaymentsByContractId(contractId) {
    try {
        if (!db) {
            console.error('Database not initialized');
            return [];
        }
        const result = db.exec(`SELECT * FROM payments WHERE contract_id = ${contractId} ORDER BY payment_date DESC, created_at DESC`);
        if (result.length === 0) return [];
        return result[0].values.map(row => {
            const columns = result[0].columns;
            const obj = {};
            columns.forEach((col, idx) => {
                obj[col] = row[idx];
            });
            return obj;
        });
    } catch (error) {
        console.error('Error getting payments:', error);
        return [];
    }
}

// حساب المبلغ المتبقي لعقد معين
function getRemainingAmount(contractId) {
    try {
        const contract = getContractById(contractId);
        if (!contract) return 0;
        
        const totalAmount = contract.total_amount || 0;
        const amountPaid = contract.amount_paid || 0;
        const remaining = totalAmount - amountPaid;
        
        return remaining >= 0 ? remaining : 0;
    } catch (error) {
        console.error('Error calculating remaining amount:', error);
        return 0;
    }
}

// حذف دفعة
function deletePayment(paymentId) {
    try {
        // الحصول على بيانات الدفعة قبل الحذف
        const paymentResult = db.exec(`SELECT contract_id, amount FROM payments WHERE id = ${paymentId}`);
        if (paymentResult.length === 0 || paymentResult[0].values.length === 0) {
            return { success: false, error: 'Payment not found' };
        }
        
        const contractId = paymentResult[0].values[0][0];
        const amount = paymentResult[0].values[0][1];
        
        // حذف الدفعة
        db.run(`DELETE FROM payments WHERE id = ${paymentId}`);
        
        // تحديث المبلغ المدفوع في العقد
        const contract = getContractById(contractId);
        if (contract) {
            const newAmountPaid = Math.max(0, (contract.amount_paid || 0) - amount);
            db.run(`UPDATE contracts SET amount_paid = ? WHERE id = ?`, [newAmountPaid, contractId]);
        }
        
        saveDatabase();
        return { success: true };
    } catch (error) {
        console.error('Error deleting payment:', error);
        return { success: false, error: error.message };
    }
}

// تصدير قاعدة البيانات
function exportDatabase() {
    try {
        const data = db.export();
        const blob = new Blob([data], { type: 'application/octet-stream' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `real_estate_db_${new Date().toISOString().split('T')[0]}.db`;
        a.click();
        URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Error exporting database:', error);
    }
}

// استيراد قاعدة البيانات
function importDatabase(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const uint8Array = new Uint8Array(e.target.result);
                db = new SQL.Database(uint8Array);
                saveDatabase();
                resolve({ success: true });
            } catch (error) {
                reject({ success: false, error: error.message });
            }
        };
        reader.onerror = () => reject({ success: false, error: 'File read error' });
        reader.readAsArrayBuffer(file);
    });
}

// الحصول على العقود المتأخرة عن الدفع
function getOverdueContracts() {
    try {
        const today = new Date().toISOString().split('T')[0];
        const allContracts = getAllContracts();
        const overdueContracts = [];
        
        allContracts.forEach(contract => {
            const remaining = getRemainingAmount(contract.id);
            if (remaining > 0) {
                // الحصول على آخر دفعة لتحديد موعد الدفعة القادمة
                const payments = getPaymentsByContractId(contract.id);
                let nextDueDate = null;
                let daysOverdue = 0;
                
                if (payments.length > 0) {
                    // إذا كان هناك دفعات، نستخدم آخر دفعة + 30 يوم كموعد افتراضي
                    const lastPayment = payments[0];
                    const lastPaymentDate = new Date(lastPayment.payment_date);
                    lastPaymentDate.setDate(lastPaymentDate.getDate() + 30);
                    nextDueDate = lastPaymentDate.toISOString().split('T')[0];
                } else {
                    // إذا لم تكن هناك دفعات، نستخدم تاريخ العقد + 30 يوم
                    const contractDate = new Date(contract.contract_date);
                    contractDate.setDate(contractDate.getDate() + 30);
                    nextDueDate = contractDate.toISOString().split('T')[0];
                }
                
                // حساب أيام التأخير
                if (nextDueDate && nextDueDate < today) {
                    const dueDate = new Date(nextDueDate);
                    const todayDate = new Date(today);
                    daysOverdue = Math.floor((todayDate - dueDate) / (1000 * 60 * 60 * 24));
                    
                    overdueContracts.push({
                        ...contract,
                        remaining_amount: remaining,
                        next_due_date: nextDueDate,
                        days_overdue: daysOverdue
                    });
                }
            }
        });
        
        // ترتيب حسب أيام التأخير (الأكثر تأخراً أولاً)
        overdueContracts.sort((a, b) => b.days_overdue - a.days_overdue);
        
        return overdueContracts;
    } catch (error) {
        console.error('Error getting overdue contracts:', error);
        return [];
    }
}

// البحث عن عقود حسب اسم المشتري أو رقم الموبايل أو رقم الدار
function searchContractsByBuyer(searchTerm) {
    try {
        const allContracts = getAllContracts();
        const searchLower = searchTerm.toLowerCase().trim();
        
        if (!searchLower) {
            return getOverdueContracts();
        }
        
        const results = allContracts.filter(contract => {
            const remaining = getRemainingAmount(contract.id);
            if (remaining <= 0) return false;
            
            const buyerName = (contract.buyer_name || '').toLowerCase();
            const mobileNumber = (contract.mobile_number || '').toString();
            const houseNumber = (contract.house_number || '').toString();
            
            return buyerName.includes(searchLower) || 
                   mobileNumber.includes(searchLower) || 
                   houseNumber.includes(searchLower);
        });
        
        // إضافة معلومات الديون لكل نتيجة
        return results.map(contract => {
            const remaining = getRemainingAmount(contract.id);
            const payments = getPaymentsByContractId(contract.id);
            let nextDueDate = null;
            let daysOverdue = 0;
            
            if (payments.length > 0) {
                const lastPayment = payments[0];
                const lastPaymentDate = new Date(lastPayment.payment_date);
                lastPaymentDate.setDate(lastPaymentDate.getDate() + 30);
                nextDueDate = lastPaymentDate.toISOString().split('T')[0];
            } else {
                const contractDate = new Date(contract.contract_date);
                contractDate.setDate(contractDate.getDate() + 30);
                nextDueDate = contractDate.toISOString().split('T')[0];
            }
            
            const today = new Date().toISOString().split('T')[0];
            if (nextDueDate && nextDueDate < today) {
                const dueDate = new Date(nextDueDate);
                const todayDate = new Date(today);
                daysOverdue = Math.floor((todayDate - dueDate) / (1000 * 60 * 60 * 24));
            }
            
            return {
                ...contract,
                remaining_amount: remaining,
                next_due_date: nextDueDate,
                days_overdue: daysOverdue
            };
        }).sort((a, b) => b.days_overdue - a.days_overdue);
    } catch (error) {
        console.error('Error searching contracts:', error);
        return [];
    }
}

