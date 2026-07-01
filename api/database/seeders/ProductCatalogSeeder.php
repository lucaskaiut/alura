<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Product;
use App\Models\Tenant;
use Illuminate\Database\Seeder;

class ProductCatalogSeeder extends Seeder
{
    public function run(): void
    {
        $tenantId = Tenant::first()?->id;

        if (! $tenantId) {
            $this->command?->warn('No tenants found. Run DatabaseSeeder first or create a tenant before seeding the catalog.');
            return;
        }

        if (Category::count() > 0) {
            $this->command?->info('Categories already exist — skipping catalog seeder.');
            return;
        }

        $tenantId = Tenant::first()->id;

        // ── Categories ──

        $notebooks = Category::create(['tenant_id' => $tenantId, 'name' => 'Notebooks', 'slug' => 'notebooks', 'status' => true]);
        $perifericos = Category::create(['tenant_id' => $tenantId, 'name' => 'Periféricos', 'slug' => 'perifericos', 'status' => true]);
        $acessorios = Category::create(['tenant_id' => $tenantId, 'name' => 'Acessórios', 'slug' => 'acessorios', 'status' => true]);
        $monitores = Category::create(['tenant_id' => $tenantId, 'name' => 'Monitores', 'slug' => 'monitores', 'status' => true]);

        // ── Products ──

        Product::insert([
            // Notebooks
            ['tenant_id' => $tenantId, 'category_id' => $notebooks->id, 'name' => 'TitanBook Pro 15', 'slug' => 'titanbook-pro-15', 'short_desc' => 'Intel Core Ultra 7, 32GB DDR5, SSD 1TB, RTX 4070', 'sku' => 'NB-TB15-I7', 'price' => 5999.00, 'status' => true, 'created_at' => now(), 'updated_at' => now()],
            ['tenant_id' => $tenantId, 'category_id' => $notebooks->id, 'name' => 'ZenBook S 14', 'slug' => 'zenbook-s-14', 'short_desc' => 'Intel Core i7-1360P, 16GB RAM, 512GB SSD, Tela OLED 14"', 'sku' => 'NB-ZS14-I7', 'price' => 4499.00, 'status' => true, 'created_at' => now(), 'updated_at' => now()],
            ['tenant_id' => $tenantId, 'category_id' => $notebooks->id, 'name' => 'MacBook Pro 14 M3', 'slug' => 'macbook-pro-14-m3', 'short_desc' => 'Apple M3, 18GB RAM, 512GB SSD, Tela Liquid Retina XDR', 'sku' => 'NB-MBP14-M3', 'price' => 12999.00, 'status' => true, 'created_at' => now(), 'updated_at' => now()],
            ['tenant_id' => $tenantId, 'category_id' => $notebooks->id, 'name' => 'Dell XPS 16', 'slug' => 'dell-xps-16', 'short_desc' => 'Intel Core Ultra 9, 32GB RAM, 1TB SSD, RTX 4060 8GB', 'sku' => 'NB-DX16-I9', 'price' => 8499.00, 'status' => true, 'created_at' => now(), 'updated_at' => now()],

            // Periféricos
            ['tenant_id' => $tenantId, 'category_id' => $perifericos->id, 'name' => 'Teclado Mecânico RGB Switch Red', 'slug' => 'teclado-mecanico-rgb-red', 'short_desc' => 'Switch Red, Layout ABNT2, Retroiluminado RGB, USB-C', 'sku' => 'PR-KB-RGB-RED', 'price' => 349.90, 'status' => true, 'created_at' => now(), 'updated_at' => now()],
            ['tenant_id' => $tenantId, 'category_id' => $perifericos->id, 'name' => 'Mouse Gamer 12 Botões 16K DPI', 'slug' => 'mouse-gamer-12b-16k', 'short_desc' => 'Sensor óptico 16.000 DPI, 12 botões programáveis, RGB', 'sku' => 'PR-MS-G12', 'price' => 229.90, 'status' => true, 'created_at' => now(), 'updated_at' => now()],
            ['tenant_id' => $tenantId, 'category_id' => $perifericos->id, 'name' => 'Headset Gamer Surround 7.1', 'slug' => 'headset-gamer-surround', 'short_desc' => 'Drivers 50mm, Surround 7.1, Microfone removível, USB/P2', 'sku' => 'PR-HS-71', 'price' => 189.90, 'status' => true, 'created_at' => now(), 'updated_at' => now()],
            ['tenant_id' => $tenantId, 'category_id' => $perifericos->id, 'name' => 'Webcam 4K Autofoco', 'slug' => 'webcam-4k-autofoco', 'short_desc' => 'Resolução 4K@30fps, Autofoco, Microfone estéreo, USB-C', 'sku' => 'PR-WC-4K', 'price' => 449.90, 'status' => true, 'created_at' => now(), 'updated_at' => now()],

            // Acessórios
            ['tenant_id' => $tenantId, 'category_id' => $acessorios->id, 'name' => 'Hub USB-C 7 Portas', 'slug' => 'hub-usbc-7-portas', 'short_desc' => 'HDMI 4K, USB-A 3.0, USB-C PD 100W, SD/TF, RJ45 Gigabit', 'sku' => 'AC-HUB-7P', 'price' => 179.90, 'status' => true, 'created_at' => now(), 'updated_at' => now()],
            ['tenant_id' => $tenantId, 'category_id' => $acessorios->id, 'name' => 'Suporte Ergonômico para Notebook', 'slug' => 'suporte-ergonomico-notebook', 'short_desc' => 'Alumínio, Ajustável, Dobrável, Ventilação passiva', 'sku' => 'AC-SUP-NB', 'price' => 129.90, 'status' => true, 'created_at' => now(), 'updated_at' => now()],
            ['tenant_id' => $tenantId, 'category_id' => $acessorios->id, 'name' => 'Mochila para Notebook 15.6"', 'slug' => 'mochila-notebook-156', 'short_desc' => 'Impermeável, Compartimento acolchoado, USB charging port', 'sku' => 'AC-MOCH-15', 'price' => 199.90, 'status' => true, 'created_at' => now(), 'updated_at' => now()],
            ['tenant_id' => $tenantId, 'category_id' => $acessorios->id, 'name' => 'Mousepad XXL Speed', 'slug' => 'mousepad-xxl-speed', 'short_desc' => '900x400mm, Base antiderrapante, Costura reforçada', 'sku' => 'AC-MP-XXL', 'price' => 89.90, 'status' => true, 'created_at' => now(), 'updated_at' => now()],

            // Monitores
            ['tenant_id' => $tenantId, 'category_id' => $monitores->id, 'name' => 'Monitor UltraWide 34" QHD', 'slug' => 'monitor-ultrawide-34-qhd', 'short_desc' => '3440x1440, IPS, 144Hz, 1ms, FreeSync Premium, HDR400', 'sku' => 'MT-UW34-QHD', 'price' => 2499.00, 'status' => true, 'created_at' => now(), 'updated_at' => now()],
            ['tenant_id' => $tenantId, 'category_id' => $monitores->id, 'name' => 'Monitor 27" 4K USB-C', 'slug' => 'monitor-27-4k-usbc', 'short_desc' => '3840x2160, IPS, 60Hz, USB-C 65W, Hub integrado', 'sku' => 'MT-27-4K', 'price' => 1899.00, 'status' => true, 'created_at' => now(), 'updated_at' => now()],
            ['tenant_id' => $tenantId, 'category_id' => $monitores->id, 'name' => 'Monitor Portátil 15.6" Full HD', 'slug' => 'monitor-portatil-156-fhd', 'short_desc' => '1920x1080, IPS, USB-C, 560g, Capa magnética', 'sku' => 'MT-PORT-15', 'price' => 699.90, 'status' => true, 'created_at' => now(), 'updated_at' => now()],
        ]);
    }
}