import express from 'express';
import { randomUUID } from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import mysql, { ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { getSmtpSettingsForAdmin, saveSmtpSettings } from '../services/smtpConfigStore';
import {
  getSiteSettingsAdmin,
  saveSiteSettings,
} from '../services/siteSettingsStore';
import { sendSmtpTestEmail } from '../services/email';
import {
  coerceHeroSlidesArray,
  normalizeSectionContent,
  parseContentColumn,
} from '../utils/contentNormalize';
import { generateUniqueProductSlug, slugNeedsSeoUpdate } from '../utils/slug';

const router = express.Router();
/** Max gallery files accepted per create/update product request. */
const MAX_PRODUCT_IMAGES = 10;
const DEFAULT_ADMIN_USERNAME = process.env.DEFAULT_ADMIN_USERNAME || 'abhishek.deolalikar@gmail.com';
const DEFAULT_ADMIN_PASSWORD = process.env.DEFAULT_ADMIN_PASSWORD || 'admin@Cottonunique2026';

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'product-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Database connection (reuse from main app)
const dbConfig: any = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  database: process.env.DB_NAME || 'cottoniq_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

if (process.env.DB_PASSWORD !== undefined && process.env.DB_PASSWORD.trim() !== '') {
  dbConfig.password = process.env.DB_PASSWORD;
}

const pool = mysql.createPool(dbConfig);

type SeedContentSection = {
  section_key: string;
  title: string;
  content: Record<string, unknown>;
  is_active: boolean;
};

const DEFAULT_CONTENT_SECTIONS: SeedContentSection[] = [
  {
    section_key: 'hero',
    title: 'Homepage Hero',
    content: {
      headline: 'Where intelligent design meets ethical craftsmanship',
      subheadline: 'Smart. Sustainable. Global.',
      cta_primary: 'Contact Us',
      cta_secondary: 'View Products',
      slides: [
        {
          title: 'ECOTOTE DUOPACK',
          subtitle: 'Sustainable Packaging',
          description: 'Reusable Cotton Tote + Compostable Inner Bag. Plastic-free packaging for fashion brands and exporters.',
          image: '/images/banner/baner5.png',
          badge: 'Premium. Sustainable. Zero-Waste.',
        },
        {
          title: 'FLORAL ELEGANCE',
          subtitle: 'Premium Canvas Totes',
          description: 'Beautiful cream canvas tote bags featuring vibrant floral designs. Perfect blend of style and sustainability for your everyday needs.',
          image: '/images/banner/baner1.jpeg',
          badge: 'Elegant. Stylish. Sustainable.',
        },
        {
          title: 'FIND JOY',
          subtitle: 'In The Ordinary',
          description: 'Light beige canvas tote with cheerful bee design. Spread positivity and joy with our beautifully crafted, eco-friendly tote bags.',
          image: '/images/banner/baner2.jpeg',
          badge: 'Joyful. Inspiring. Eco-Friendly.',
        },
        {
          title: 'WATERCOLOR COLLECTION',
          subtitle: 'Artistic Designs',
          description: 'Stunning watercolor floral prints on premium canvas. Each tote is a work of art, combining functionality with beautiful aesthetics.',
          image: '/images/banner/baner3.jpeg',
          badge: 'Artistic. Unique. Premium.',
        },
        {
          title: 'SUNFLOWER EMBROIDERED',
          subtitle: 'Handcrafted Excellence',
          description: 'Exquisite embroidered sunflower design on natural canvas. Handcrafted with attention to detail for a truly special tote bag.',
          image: '/images/banner/baner4.jpeg',
          badge: 'Handcrafted. Detailed. Special.',
        },
      ],
    },
    is_active: true,
  },
  {
    section_key: 'highlights',
    title: 'Key Highlights',
    content: {
      items: [
        'GOTS-certified cotton',
        'FSC-compliant packaging',
        'Export-ready documentation',
        'Custom branding for corporate gifting',
      ],
    },
    is_active: true,
  },
  {
    section_key: 'about_mission',
    title: 'Our Mission',
    content: {
      content:
        'To deliver premium, sustainable tote bags that meet the highest global standards—ethically sourced, intelligently designed, and export-ready.',
    },
    is_active: true,
  },
  {
    section_key: 'about',
    title: 'About Us Section',
    content: {
      heading: 'ABOUT US',
      subheading: 'Premium Sustainable Tote Bags',
      description:
        'We craft premium cotton tote bags in India for businesses, exporters, and corporates worldwide. Every piece is ethically sourced, GOTS certified, and built to meet the highest global standards for export-ready programmes—without compromising on quality or sustainability.',
      image_left: '/images/aboutus/about2.png',
      image_right: '/images/aboutus/about1.png',
    },
    is_active: true,
  },
  {
    section_key: 'about_story',
    title: 'Our Story',
    content: {
      content:
        'Born from a passion for sustainability and global commerce, Cottonunique blends natural materials with modern branding to serve clients across continents.',
    },
    is_active: true,
  },
  {
    section_key: 'certifications',
    title: 'Certifications',
    content: {
      items: ['GOTS', 'FSC', 'MSME & export compliance'],
    },
    is_active: true,
  },
  {
    section_key: 'ecotote_duopack',
    title: 'EcoTote DuoPack Section',
    content: {
      heading: 'ECOTOTE',
      subheading: 'Our Competitive Edge',
      description:
        "We provide lower than industry standard MOQ's to help test markets and refine products at competitive prices.",
      cta: 'Request Quote for EcoTote DuoPack',
      image: '/images/banner/d.png',
      outer_bag: {
        title: 'Outer Bag',
        material: '100% cotton, 180 GSM',
        size: 'available in customized size',
        printing: 'Water-based (1–3 colors)',
        certification: 'GOTS compliant',
      },
      inner_bag: {
        title: 'Inner Bag',
        material: 'PLA/PBAT blend',
        size: 'available in customized size',
        finish: 'Transparent or frosted',
        certification: 'ISO/IEC17025, ASTM D6866',
      },
    },
    is_active: true,
  },
  {
    section_key: 'products_home',
    title: 'Homepage Products Section',
    content: {
      heading: 'Organic Cotton Tote Bags for Every Market',
      subheading: 'Premium sustainable bags designed for global commerce',
      cta_primary: 'View All Products',
      cta_secondary: 'Request Samples',
    },
    is_active: true,
  },
  {
    section_key: 'corporate',
    title: 'Corporate Solutions Section',
    content: {
      heading: 'Smart Branding for Global Teams',
      subheading:
        'Transform your corporate gifting with sustainable, custom-branded solutions. Get custom printed cotton tote bags with your logo, colours, and branding — perfect for gifting, retail, and events. We fulfil bulk orders with fast turnaround times and export-ready packaging — minimum order quantities available for all business sizes.',
      cta: 'Book a Consultation',
      image: '/images/corporate/image2.png',
    },
    is_active: true,
  },
  {
    section_key: 'sustainability',
    title: 'Sustainability Section',
    content: {
      heading: 'More Than Just a Bag',
      subheading: 'Every Cottonunique product tells a story of sustainable practices and positive impact',
      report_cta: 'View Our Sustainability Report',
      image: '/images/new/WhatsApp Image 2025-12-27 at 6.17.05 PM.jpeg',
    },
    is_active: true,
  },
  {
    section_key: 'export',
    title: 'Export & Compliance Section',
    content: {
      heading: 'Export & Compliance',
      subheading: 'Seamless global delivery with complete regulatory compliance',
      cta_primary: 'Download Export Pack',
      cta_secondary: 'Talk to Our Compliance Team',
      image: '/images/new/WhatsApp Image 2025-12-27 at 6.17.08 PM (2).jpeg',
    },
    is_active: true,
  },
  {
    section_key: 'banners',
    title: 'Website Banners',
    content: {
      main_banner: {
        title: 'Premium Sustainable Tote Bags',
        subtitle: 'Eco-friendly solutions for global commerce',
        description: 'GOTS-certified cotton totes designed for businesses worldwide',
        image: '/images/banner/baner5.png',
        cta_text: 'Explore Products',
        cta_link: '/#products',
      },
      about_banner: {
        title: 'About Our Mission',
        subtitle: 'Sustainable craftsmanship meets global standards',
        image: '/images/aboutus/about1.png',
      },
      corporate_banner: {
        title: 'Corporate Solutions',
        subtitle: 'Custom branding for global teams',
        image: '/images/corporate/image2.png',
      },
      sustainability_banner: {
        title: 'Sustainability First',
        subtitle: 'Every product tells a story of positive impact',
        image: '/images/new/WhatsApp Image 2025-12-27 at 6.17.05 PM.jpeg',
      },
      export_banner: {
        title: 'Export & Compliance',
        subtitle: 'Seamless global delivery with complete compliance',
        image: '/images/new/WhatsApp Image 2025-12-27 at 6.17.08 PM (2).jpeg',
      },
    },
    is_active: true,
  },
  {
    section_key: 'trust_strip',
    title: 'Trust Strip',
    content: {
      headline: 'Certified sustainable · Trusted by businesses worldwide',
      items: ['GOTS Certified', 'FSC Compliant', 'MSME Registered', 'Export Ready'],
    },
    is_active: true,
  },
  {
    section_key: 'contact',
    title: 'Contact Section',
    content: {
      heading: 'Get in Touch',
      subheading: "Ready to start your sustainable journey? Let's create something amazing together.",
      email_primary: 'abhishek.deolalikar@gmail.com',
      email_secondary: '',
      phone: '+91 7020631149',
      whatsapp_number: '+91 7020631149',
      whatsapp_message: "Hi Cottonunique! I’d like to know more about your tote bags.",
      visit_heading: 'Visit Us',
      visit_line_1: 'Sr no 131, STG, Alandi Road',
      visit_line_2: 'Pune - 412105',
    },
    is_active: true,
  },
  {
    section_key: 'get_in_touch',
    title: 'Get in Touch Section',
    content: {
      heading: 'Get in Touch',
      subheading: "Ready to start your sustainable journey? Let's create something amazing together.",
      cta: 'Send Inquiry',
    },
    is_active: true,
  },
];

async function ensureDefaultContentSections() {
  for (const section of DEFAULT_CONTENT_SECTIONS) {
    await pool.execute(
      `INSERT INTO content_sections (id, section_key, title, content, is_active)
       SELECT UUID(), ?, ?, ?, ?
       WHERE NOT EXISTS (
         SELECT 1 FROM content_sections WHERE section_key = ?
       )`,
      [
        section.section_key,
        section.title,
        JSON.stringify(section.content),
        section.is_active ? 1 : 0,
        section.section_key,
      ]
    );
  }
  // Migrate existing rows: inject missing image fields without overwriting existing ones
  await migrateContentImages();
  await migrateEcototeDuopackSpecs();
}

// Image fields to inject per section if missing
const IMAGE_MIGRATIONS: Record<string, Record<string, string>> = {
  about: {
    image_left: '/images/aboutus/about2.png',
    image_right: '/images/aboutus/about1.png',
  },
  corporate: { image: '/images/corporate/image2.png' },
  sustainability: { image: '/images/new/WhatsApp Image 2025-12-27 at 6.17.05 PM.jpeg' },
  export: { image: '/images/new/WhatsApp Image 2025-12-27 at 6.17.08 PM (2).jpeg' },
  ecotote_duopack: { image: '/images/banner/d.png' },
  banners: {
    main_banner: JSON.stringify({
      title: 'Premium Sustainable Tote Bags',
      subtitle: 'Eco-friendly solutions for global commerce',
      description: 'GOTS-certified cotton totes designed for businesses worldwide',
      image: '/images/banner/baner5.png',
      cta_text: 'Explore Products',
      cta_link: '/#products',
    }),
    about_banner: JSON.stringify({
      title: 'About Our Mission',
      subtitle: 'Sustainable craftsmanship meets global standards',
      image: '/images/aboutus/about1.png',
    }),
    corporate_banner: JSON.stringify({
      title: 'Corporate Solutions',
      subtitle: 'Custom branding for global teams',
      image: '/images/corporate/image2.png',
    }),
    sustainability_banner: JSON.stringify({
      title: 'Sustainability First',
      subtitle: 'Every product tells a story of positive impact',
      image: '/images/new/WhatsApp Image 2025-12-27 at 6.17.05 PM.jpeg',
    }),
    export_banner: JSON.stringify({
      title: 'Export & Compliance',
      subtitle: 'Seamless global delivery with complete compliance',
      image: '/images/new/WhatsApp Image 2025-12-27 at 6.17.08 PM (2).jpeg',
    }),
  },
  hero: {
    slides: JSON.stringify([
      { title: 'ECOTOTE DUOPACK', subtitle: 'Sustainable Packaging', description: 'Reusable Cotton Tote + Compostable Inner Bag. Plastic-free packaging for fashion brands and exporters.', image: '/images/banner/baner5.png', badge: 'Premium. Sustainable. Zero-Waste.' },
      { title: 'FLORAL ELEGANCE', subtitle: 'Premium Canvas Totes', description: 'Beautiful cream canvas tote bags featuring vibrant floral designs. Perfect blend of style and sustainability for your everyday needs.', image: '/images/banner/baner1.jpeg', badge: 'Elegant. Stylish. Sustainable.' },
      { title: 'FIND JOY', subtitle: 'In The Ordinary', description: 'Light beige canvas tote with cheerful bee design. Spread positivity and joy with our beautifully crafted, eco-friendly tote bags.', image: '/images/banner/baner2.jpeg', badge: 'Joyful. Inspiring. Eco-Friendly.' },
      { title: 'WATERCOLOR COLLECTION', subtitle: 'Artistic Designs', description: 'Stunning watercolor floral prints on premium canvas. Each tote is a work of art, combining functionality with beautiful aesthetics.', image: '/images/banner/baner3.jpeg', badge: 'Artistic. Unique. Premium.' },
      { title: 'SUNFLOWER EMBROIDERED', subtitle: 'Handcrafted Excellence', description: 'Exquisite embroidered sunflower design on natural canvas. Handcrafted with attention to detail for a truly special tote bag.', image: '/images/banner/baner4.jpeg', badge: 'Handcrafted. Detailed. Special.' },
    ]),
  },
};

async function migrateContentImages() {
  for (const [sectionKey, fields] of Object.entries(IMAGE_MIGRATIONS)) {
    const [rows] = await pool.execute(
      'SELECT id, content FROM content_sections WHERE section_key = ?',
      [sectionKey]
    ) as any[];
    if (!rows || rows.length === 0) continue;
    const row = rows[0];
    let content: Record<string, unknown>;
    try {
      content = typeof row.content === 'string' ? JSON.parse(row.content) : row.content;
    } catch { continue; }
    let changed = false;
    for (const [field, defaultVal] of Object.entries(fields)) {
      if (field === 'slides') {
        const slides = coerceHeroSlidesArray(content[field]);
        if (slides.length === 0) {
          content[field] = JSON.parse(defaultVal as string);
          changed = true;
        } else {
          const raw = content[field];
          if (!Array.isArray(raw) || JSON.stringify(raw) !== JSON.stringify(slides)) {
            content[field] = slides;
            changed = true;
          }
        }
        continue;
      }
      if (content[field] === undefined || content[field] === null) {
        content[field] = defaultVal;
        changed = true;
      }
    }
    if (changed) {
      await pool.execute(
        'UPDATE content_sections SET content = ? WHERE id = ?',
        [JSON.stringify(content), row.id]
      );
    }
  }
}

async function migrateEcototeDuopackSpecs() {
  const OUTER_DEFAULT: Record<string, string> = {
    title: 'Outer Bag',
    material: '100% cotton, 180 GSM',
    size: 'available in customized size',
    printing: 'Water-based (1–3 colors)',
    certification: 'GOTS compliant',
  };
  const INNER_DEFAULT: Record<string, string> = {
    title: 'Inner Bag',
    material: 'PLA/PBAT blend',
    size: 'available in customized size',
    finish: 'Transparent or frosted',
    certification: 'ISO/IEC17025, ASTM D6866',
  };
  const mergeNested = (def: Record<string, string>, cur: unknown): Record<string, string> => ({
    ...def,
    ...(cur && typeof cur === 'object' && !Array.isArray(cur) ? (cur as Record<string, string>) : {}),
  });

  const [rows] = await pool.execute(
    'SELECT id, content FROM content_sections WHERE section_key = ?',
    ['ecotote_duopack']
  ) as any[];
  if (!rows || rows.length === 0) return;
  const row = rows[0];
  let content: Record<string, unknown>;
  try {
    content = typeof row.content === 'string' ? JSON.parse(row.content) : row.content;
  } catch {
    return;
  }
  const next = {
    ...content,
    outer_bag: mergeNested(OUTER_DEFAULT, content.outer_bag),
    inner_bag: mergeNested(INNER_DEFAULT, content.inner_bag),
  };
  if (JSON.stringify(next) !== JSON.stringify(content)) {
    await pool.execute('UPDATE content_sections SET content = ? WHERE id = ?', [
      JSON.stringify(next),
      row.id,
    ]);
  }
}

// Admin login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    // Check if admin user exists (create configured default admin if not found)
    const [rows] = await pool.execute(
      'SELECT * FROM admin_users WHERE username = ?',
      [username]
    );

    let user: any;
    if (Array.isArray(rows) && rows.length === 0) {
      // Bootstrap only the configured default admin credentials.
      if (username === DEFAULT_ADMIN_USERNAME && password === DEFAULT_ADMIN_PASSWORD) {
        const hashedPassword = await bcrypt.hash(DEFAULT_ADMIN_PASSWORD, 10);
        await pool.execute(
          'INSERT INTO admin_users (username, password) VALUES (?, ?)',
          [DEFAULT_ADMIN_USERNAME, hashedPassword]
        );
        const [newRows] = await pool.execute('SELECT id, username FROM admin_users WHERE username = ?', [DEFAULT_ADMIN_USERNAME]);
        user = Array.isArray(newRows) && newRows.length > 0 ? (newRows as any[])[0] : { id: 1, username: DEFAULT_ADMIN_USERNAME };
      } else {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
    } else {
      user = (rows as any[])[0];
      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
    }

    const token = jwt.sign(
      { id: user.id, username: user.username },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: { id: user.id, username: user.username }
    });
  } catch (error: any) {
    console.error('Login error:', error);
    let msg = 'Login failed';
    if (error?.code === 'ER_NO_SUCH_TABLE' || error?.sqlMessage?.includes('admin_users')) {
      msg = 'Database not set up. Run the schema: backend/database/mysql_schema.sql';
    } else if (error?.code === 'ECONNREFUSED' || error?.code === 'ER_ACCESS_DENIED_ERROR') {
      msg = 'Database connection failed. Check MySQL is running and backend .env (DB_HOST, DB_USER, DB_PASSWORD, DB_NAME).';
    } else if (error?.sqlMessage) {
      msg = error.sqlMessage;
    } else if (error?.message) {
      msg = error.message;
    }
    res.status(500).json({ error: msg });
  }
});

// Get all products (admin)
router.get('/products', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM products ORDER BY created_at DESC'
    );
    res.json(rows);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

/** Normalize specifications for DB: always return valid JSON string for CHECK (json_valid). */
function normalizeSpecifications(specifications: unknown): string {
  if (specifications == null || specifications === '') return '{}';
  if (typeof specifications === 'string') {
    try {
      const parsed = JSON.parse(specifications);
      return JSON.stringify(parsed);
    } catch {
      return '{}';
    }
  }
  try {
    return JSON.stringify(specifications);
  } catch {
    return '{}';
  }
}

// Create new product (up to MAX_PRODUCT_IMAGES gallery files). Accept both "image" and "images" field names.
router.post('/products', authenticateToken, upload.any(), async (req: AuthRequest, res) => {
  try {
    const body = req.body || {};
    const { name, category, description, material, print_type, packaging, moq, price, specifications, is_featured } = body;

    if (!name || !category || !description) {
      return res.status(400).json({ error: 'Name, category, and description are required' });
    }

    const rawFiles = (req as any).files as Express.Multer.File[] | undefined;
    const files = Array.isArray(rawFiles) ? rawFiles.slice(0, MAX_PRODUCT_IMAGES) : [];
    const urls = Array.isArray(files) && files.length > 0
      ? files.map((f) => `/uploads/${f.filename}`)
      : [];
    const image_url = urls[0] || null;
    const gallery_images = JSON.stringify(urls);

    const specsStr = normalizeSpecifications(specifications);
    const isFeatured = is_featured === 'true' || is_featured === true;
    const productId = randomUUID();
    const slug = await generateUniqueProductSlug(pool, String(name));

    const baseParams = [
      String(name),
      String(category),
      String(description),
      material || '100% GOTS-certified cotton',
      print_type || 'Water-based inks',
      packaging || 'FSC-certified hangtags and labels',
      moq || '',
      parseFloat(price) || 0,
      image_url,
      specsStr,
      isFeatured
    ];

    try {
      await pool.execute(
        `INSERT INTO products (id, slug, name, category, description, material, print_type, packaging, moq, price, image_url, gallery_images, specifications, is_featured, is_active) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
        [productId, slug, baseParams[0], baseParams[1], baseParams[2], baseParams[3], baseParams[4], baseParams[5], baseParams[6], baseParams[7], baseParams[8], gallery_images, baseParams[9], baseParams[10]]
      );
    } catch (insertErr: any) {
      if (insertErr?.code === 'ER_BAD_FIELD_ERROR' && insertErr?.sqlMessage?.includes('gallery_images')) {
        await pool.execute(
          `INSERT INTO products (id, slug, name, category, description, material, print_type, packaging, moq, price, image_url, specifications, is_featured, is_active) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
          [productId, slug, ...baseParams]
        );
      } else if (insertErr?.code === 'ER_BAD_FIELD_ERROR' && insertErr?.sqlMessage?.includes('slug')) {
        await pool.execute(
          `INSERT INTO products (id, name, category, description, material, print_type, packaging, moq, price, image_url, gallery_images, specifications, is_featured, is_active) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
          [productId, baseParams[0], baseParams[1], baseParams[2], baseParams[3], baseParams[4], baseParams[5], baseParams[6], baseParams[7], baseParams[8], gallery_images, baseParams[9], baseParams[10]]
        );
      } else {
        throw insertErr;
      }
    }

    res.status(201).json({
      message: 'Product created successfully',
      id: productId,
      slug
    });
  } catch (error: any) {
    console.error('Error creating product:', error);
    const sqlMessage = error?.sqlMessage || '';
    const message = error?.code === 'ER_INVALID_JSON' || sqlMessage.includes('JSON')
      ? 'Invalid specifications format'
      : sqlMessage || error?.message || 'Failed to create product';
    res.status(500).json({ error: message, code: error?.code });
  }
});

// Update product (up to MAX_PRODUCT_IMAGES gallery files). Accept both "image" and "images" field names.
router.put('/products/:id', authenticateToken, upload.any(), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { name, category, description, material, print_type, packaging, moq, price, specifications, is_featured } = req.body;

    const specsStr = normalizeSpecifications(specifications);

    const [existingSlugRows] = await pool.execute<mysql.RowDataPacket[]>(
      'SELECT slug FROM products WHERE id = ? LIMIT 1',
      [id]
    );
    const existingSlug =
      Array.isArray(existingSlugRows) && existingSlugRows[0]?.slug
        ? String(existingSlugRows[0].slug).trim()
        : '';
    const slug =
      name && (!existingSlug || slugNeedsSeoUpdate(String(name), existingSlug))
        ? await generateUniqueProductSlug(pool, String(name), id)
        : existingSlug;

    let updateQuery = `
      UPDATE products SET 
        slug = ?, name = ?, category = ?, description = ?, material = ?, print_type = ?, 
        packaging = ?, moq = ?, price = ?, specifications = ?, is_featured = ?, 
        updated_at = CURRENT_TIMESTAMP
    `;
    
    const queryParams: any[] = [
      slug,
      name,
      category,
      description,
      material,
      print_type,
      packaging,
      moq,
      parseFloat(price) || 0,
      specsStr,
      is_featured === 'true' || is_featured === true
    ];

    const rawFiles = (req as any).files as Express.Multer.File[] | undefined;
    const files = Array.isArray(rawFiles) ? rawFiles.slice(0, MAX_PRODUCT_IMAGES) : [];
    if (Array.isArray(files) && files.length > 0) {
      const urls = files.map((f) => `/uploads/${f.filename}`);
      updateQuery += ', image_url = ?, gallery_images = ?';
      queryParams.push(urls[0], JSON.stringify(urls));
    }

    updateQuery += ' WHERE id = ?';
    queryParams.push(id);

    await pool.execute(updateQuery, queryParams);

    res.json({ message: 'Product updated successfully' });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// Delete product
router.delete('/products/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    
    await pool.execute('DELETE FROM products WHERE id = ?', [id]);
    
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// Get all inquiries
router.get('/inquiries', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM inquiries ORDER BY created_at DESC'
    );
    res.json(rows);
  } catch (error) {
    console.error('Error fetching inquiries:', error);
    res.status(500).json({ error: 'Failed to fetch inquiries' });
  }
});

// Update inquiry status
router.put('/inquiries/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    await pool.execute(
      'UPDATE inquiries SET status = ? WHERE id = ?',
      [status, id]
    );
    
    res.json({ message: 'Inquiry status updated successfully' });
  } catch (error) {
    console.error('Error updating inquiry:', error);
    res.status(500).json({ error: 'Failed to update inquiry' });
  }
});

// Delete inquiry (DELETE for standards-compliant clients; POST for hosts that block DELETE)
async function deleteInquiryHandler(req: AuthRequest, res: express.Response) {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: 'Missing inquiry id' });
    }
    const [result] = await pool.execute('DELETE FROM inquiries WHERE id = ?', [id]);
    const affected = (result as ResultSetHeader).affectedRows;
    if (affected === 0) {
      return res.status(404).json({ error: 'Inquiry not found' });
    }
    res.json({ message: 'Inquiry deleted successfully' });
  } catch (error) {
    console.error('Error deleting inquiry:', error);
    res.status(500).json({ error: 'Failed to delete inquiry' });
  }
}

router.delete('/inquiries/:id', authenticateToken, deleteInquiryHandler);
router.post('/inquiries/:id/delete', authenticateToken, deleteInquiryHandler);

function bufferOrValueToString(v: unknown): string | null {
  if (v === undefined || v === null) return null;
  if (Buffer.isBuffer(v)) return v.toString('utf8');
  if (typeof v === 'string') return v;
  return String(v);
}

// Sample requests (product page "Request Sample")
router.get('/sample-requests', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const [rawRows] = await pool.execute<RowDataPacket[]>(
      `SELECT
         sr.id,
         sr.product_id,
         sr.product_name,
         sr.name,
         sr.company,
         sr.email,
         sr.region,
         sr.message,
         sr.status,
         sr.created_at,
         p.image_url AS product_image_url,
         p.gallery_images AS product_gallery_images,
         p.description AS product_description,
         p.category AS product_category,
         p.material AS product_material,
         p.print_type AS product_print_type,
         p.packaging AS product_packaging,
         p.moq AS product_moq,
         p.price AS product_price,
         p.specifications AS product_specifications
       FROM sample_requests sr
       LEFT JOIN products p ON BINARY p.id = BINARY sr.product_id
       ORDER BY sr.created_at DESC`
    );
    const rows = Array.isArray(rawRows) ? rawRows : [];
    /** mysql2 RowDataPacket: do not rely on `{...row}` — joined fields can be lost. Build a plain JSON object explicitly. */
    const normalized = rows.map((row) => {
      const r = row as unknown as Record<string, unknown>;
      return {
        id: r.id,
        product_id: r.product_id,
        product_name: r.product_name,
        name: r.name,
        company: r.company,
        email: r.email,
        region: r.region,
        message: r.message,
        status: r.status,
        created_at: r.created_at,
        product_image_url: bufferOrValueToString(r.product_image_url),
        product_gallery_images: bufferOrValueToString(r.product_gallery_images),
        product_description: bufferOrValueToString(r.product_description),
        product_category: bufferOrValueToString(r.product_category),
        product_material: bufferOrValueToString(r.product_material),
        product_print_type: bufferOrValueToString(r.product_print_type),
        product_packaging: bufferOrValueToString(r.product_packaging),
        product_moq: bufferOrValueToString(r.product_moq),
        product_price: r.product_price,
        product_specifications: bufferOrValueToString(r.product_specifications),
      };
    });
    res.json(normalized);
  } catch (error) {
    console.error('Error fetching sample requests:', error);
    res.status(500).json({ error: 'Failed to fetch sample requests' });
  }
});

router.put('/sample-requests/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    await pool.execute('UPDATE sample_requests SET status = ? WHERE id = ?', [status, id]);
    res.json({ message: 'Sample request status updated successfully' });
  } catch (error) {
    console.error('Error updating sample request:', error);
    res.status(500).json({ error: 'Failed to update sample request' });
  }
});

async function deleteSampleRequestHandler(req: AuthRequest, res: express.Response) {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: 'Missing sample request id' });
    }
    const [result] = await pool.execute('DELETE FROM sample_requests WHERE id = ?', [id]);
    const affected = (result as ResultSetHeader).affectedRows;
    if (affected === 0) {
      return res.status(404).json({ error: 'Sample request not found' });
    }
    res.json({ message: 'Sample request deleted successfully' });
  } catch (error) {
    console.error('Error deleting sample request:', error);
    res.status(500).json({ error: 'Failed to delete sample request' });
  }
}

router.delete('/sample-requests/:id', authenticateToken, deleteSampleRequestHandler);
router.post('/sample-requests/:id/delete', authenticateToken, deleteSampleRequestHandler);

// Get content sections
router.get('/content', authenticateToken, async (req: AuthRequest, res) => {
  try {
    await ensureDefaultContentSections();
    const [rows] = await pool.execute(
      'SELECT * FROM content_sections ORDER BY section_key'
    );
    const normalized = (rows as Record<string, unknown>[]).map((row) => {
      const sectionKey = String(row.section_key ?? '');
      const parsed = parseContentColumn(row.content);
      if (!parsed) return row;
      const content = normalizeSectionContent(sectionKey, parsed);
      return { ...row, content };
    });
    res.json(normalized);
  } catch (error) {
    console.error('Error fetching content:', error);
    res.status(500).json({ error: 'Failed to fetch content' });
  }
});

// Update content section
router.put('/content/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { title, content, is_active } = req.body;

    const [keyRows] = await pool.execute(
      'SELECT section_key FROM content_sections WHERE id = ?',
      [id]
    ) as [RowDataPacket[], unknown];
    const sectionKey =
      Array.isArray(keyRows) && keyRows.length > 0 ? String(keyRows[0].section_key ?? '') : '';

    let contentToSave =
      content && typeof content === 'object' && !Array.isArray(content)
        ? (content as Record<string, unknown>)
        : {};
    if (sectionKey) {
      contentToSave = normalizeSectionContent(sectionKey, contentToSave);
    }

    await pool.execute(
      'UPDATE content_sections SET title = ?, content = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [title, JSON.stringify(contentToSave), is_active, id]
    );
    
    res.json({ message: 'Content updated successfully' });
  } catch (error) {
    console.error('Error updating content:', error);
    res.status(500).json({ error: 'Failed to update content' });
  }
});

// Upload image for content sections
router.post('/content/upload-image', authenticateToken, upload.single('image'), async (req: AuthRequest, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }
    const url = `/uploads/${req.file.filename}`;
    res.json({ url });
  } catch (error) {
    console.error('Error uploading content image:', error);
    res.status(500).json({ error: 'Failed to upload image' });
  }
});

// ----- Chatbot Control -----
// Ensure chatbot_settings table exists
async function ensureChatbotSettingsTable() {
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS chatbot_settings (
      id INT PRIMARY KEY DEFAULT 1,
      is_enabled TINYINT(1) NOT NULL DEFAULT 1,
      custom_instructions TEXT,
      disallowed_topics TEXT,
      welcome_message TEXT,
      preferred_model VARCHAR(128) NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);
  try {
    await pool.execute('ALTER TABLE chatbot_settings ADD COLUMN preferred_model VARCHAR(128) NULL');
  } catch (_) {
    // Column already exists
  }
  const [rows] = await pool.execute('SELECT COUNT(*) as c FROM chatbot_settings');
  if ((rows as any[])[0].c === 0) {
    await pool.execute('INSERT INTO chatbot_settings (id, is_enabled) VALUES (1, 1)');
  }
}

// Get chatbot settings (admin)
router.get('/chatbot-settings', authenticateToken, async (req: AuthRequest, res) => {
  try {
    await ensureChatbotSettingsTable();
    const [rows] = await pool.execute(
      'SELECT is_enabled, custom_instructions AS customInstructions, disallowed_topics AS disallowedTopics, welcome_message AS welcomeMessage, preferred_model AS preferredModel, updated_at AS updatedAt FROM chatbot_settings WHERE id = 1'
    );
    const row = Array.isArray(rows) && rows.length > 0 ? (rows as any[])[0] : null;
    const isEnabled = row && (row.is_enabled === 1 || row.is_enabled === true || String(row.is_enabled).trim() === '1');
    res.json({
      isEnabled: Boolean(isEnabled),
      customInstructions: row?.customInstructions ?? '',
      disallowedTopics: row?.disallowedTopics ?? '',
      welcomeMessage: row?.welcomeMessage ?? '',
      preferredModel: row?.preferredModel ?? '',
      updatedAt: row?.updatedAt ?? null,
    });
  } catch (error) {
    console.error('Error fetching chatbot settings:', error);
    res.status(500).json({ error: 'Failed to fetch chatbot settings' });
  }
});

// Update chatbot settings (admin)
// Uses INSERT ... ON DUPLICATE KEY UPDATE so the row is always written (avoids UPDATE affecting 0 rows).
router.put('/chatbot-settings', authenticateToken, async (req: AuthRequest, res) => {
  try {
    await ensureChatbotSettingsTable();
    const { isEnabled, customInstructions, disallowedTopics, welcomeMessage, preferredModel } = req.body;
    // Only true, 1, or '1' mean enabled; everything else (false, 0, undefined, null) = disabled
    const isEnabledNum = isEnabled === true || isEnabled === 1 || isEnabled === '1' ? 1 : 0;
    const preferredModelVal = typeof preferredModel === 'string' && preferredModel.trim() ? preferredModel.trim() : null;
    await pool.execute(
      `INSERT INTO chatbot_settings (id, is_enabled, custom_instructions, disallowed_topics, welcome_message, preferred_model, updated_at)
       VALUES (1, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
       ON DUPLICATE KEY UPDATE
         is_enabled = VALUES(is_enabled),
         custom_instructions = VALUES(custom_instructions),
         disallowed_topics = VALUES(disallowed_topics),
         welcome_message = VALUES(welcome_message),
         preferred_model = VALUES(preferred_model),
         updated_at = CURRENT_TIMESTAMP`,
      [isEnabledNum, customInstructions ?? null, disallowedTopics ?? null, welcomeMessage ?? null, preferredModelVal]
    );
    res.json({
      message: 'Chatbot settings updated successfully',
      isEnabled: isEnabledNum === 1,
    });
  } catch (error) {
    console.error('Error updating chatbot settings:', error);
    res.status(500).json({ error: 'Failed to update chatbot settings' });
  }
});

// ----- Site settings (language toggle visibility) -----
router.get('/site-settings', authenticateToken, async (_req: AuthRequest, res) => {
  try {
    const data = await getSiteSettingsAdmin();
    res.json(data);
  } catch (error) {
    console.error('Error fetching site settings:', error);
    res.status(500).json({ error: 'Failed to fetch site settings' });
  }
});

router.put('/site-settings', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { languageToggleEnabled } = req.body;
    const enabled =
      languageToggleEnabled === true ||
      languageToggleEnabled === 1 ||
      languageToggleEnabled === '1';
    const saved = await saveSiteSettings({ languageToggleEnabled: enabled });
    res.json({
      message: 'Site settings updated successfully',
      ...saved,
    });
  } catch (error) {
    console.error('Error updating site settings:', error);
    res.status(500).json({ error: 'Failed to update site settings' });
  }
});

// ----- Email / SMTP (admin only, stored in DB; falls back to .env for sending if incomplete) -----
router.get('/smtp-settings', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const data = await getSmtpSettingsForAdmin();
    res.json(data);
  } catch (error) {
    console.error('Error fetching SMTP settings:', error);
    res.status(500).json({ error: 'Failed to fetch SMTP settings' });
  }
});

router.put('/smtp-settings', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { emailUser, appPassword, clearAppPassword } = req.body as {
      emailUser?: string;
      appPassword?: string;
      clearAppPassword?: boolean | string | number;
    };
    const clear =
      clearAppPassword === true ||
      clearAppPassword === 1 ||
      (typeof clearAppPassword === 'string' && clearAppPassword.toLowerCase() === 'true');
    await saveSmtpSettings({
      emailUser: typeof emailUser === 'string' ? emailUser : '',
      appPassword: appPassword !== undefined ? String(appPassword) : undefined,
      clearAppPassword: clear,
    });
    const data = await getSmtpSettingsForAdmin();
    res.json({ message: 'SMTP settings saved', ...data });
  } catch (error: any) {
    console.error('Error saving SMTP settings:', error);
    res.status(500).json({ error: error?.message || 'Failed to save SMTP settings' });
  }
});

router.post('/smtp-settings/test', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { to } = req.body as { to?: string };
    const addr = typeof to === 'string' && to.trim() ? to.trim() : undefined;
    if (!addr) {
      return res.status(400).json({ error: 'Provide a "to" email address for the test message' });
    }
    await sendSmtpTestEmail(addr);
    res.json({ message: `Test email sent to ${addr}` });
  } catch (error: any) {
    console.error('SMTP test failed:', error);
    res.status(400).json({ error: error?.message || 'Failed to send test email' });
  }
});

// Chatbot visibility diagnostics (admin)
router.get('/chatbot-settings/diagnostics', authenticateToken, async (req: AuthRequest, res) => {
  try {
    await ensureChatbotSettingsTable();
    const [rows] = await pool.execute(
      'SELECT is_enabled, is_enabled AS enabled FROM chatbot_settings WHERE id = 1'
    );
    const row = Array.isArray(rows) && rows.length > 0 ? (rows as any[])[0] : null;
    const rawEnabled = row?.is_enabled;
    const rawEnabledType = rawEnabled === undefined ? 'undefined' : typeof rawEnabled;
    const publicEnabled = row != null && (rawEnabled === 1 || rawEnabled === true || String(rawEnabled).trim() === '1');
    const adminEnabled = rawEnabled === 1 || rawEnabled === true || String(rawEnabled).trim() === '1';
    res.json({
      timestamp: new Date().toISOString(),
      database: {
        rawValue: rawEnabled,
        rawType: rawEnabledType,
        rawString: rawEnabled != null ? String(rawEnabled) : 'null',
      },
      adminApiReads: {
        isEnabled: adminEnabled,
        description: 'What admin GET /chatbot-settings returns for isEnabled',
      },
      publicApiReturns: {
        enabled: Boolean(publicEnabled),
        description: 'What the website GET /api/chatbot/settings receives (this controls visibility)',
      },
      verdict: {
        chatbotWillShowOnSite: Boolean(publicEnabled),
        suggestion: publicEnabled
          ? 'Site will show the chatbot. To hide it: set toggle to Off, click Save, then refresh the website or switch back to the site tab.'
          : 'Site will hide the chatbot. Toggle is working correctly.',
      },
    });
  } catch (error: any) {
    console.error('Chatbot diagnostics error:', error);
    res.status(500).json({
      timestamp: new Date().toISOString(),
      error: error.message,
      suggestion: 'Check backend logs and database connection.',
    });
  }
});

export default router;