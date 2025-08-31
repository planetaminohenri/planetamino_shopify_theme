<?php
/**
 * Plugin Name: WooCommerce Customer Thank You Letters
 * Plugin URI: http://example.com/woo-customer-letters
 * Description: Generates thank you letters for customers and allows bulk download as Word file.
 * Version: 1.0
 * Author: Your Name
 * Author URI: http://example.com
 * Text Domain: woo-customer-letters
 * Domain Path: /languages
 * WC requires at least: 3.0.0
 * WC tested up to: 9.2.3
 */

if (!defined('ABSPATH')) {
    exit; // Exit if accessed directly
}

add_action('plugins_loaded', 'initialize_wc_customer_thank_you_letters');

function initialize_wc_customer_thank_you_letters() {
    // Load PHPWord library
    require_once plugin_dir_path(__FILE__) . 'vendor/autoload.php';

    // Now that the library is loaded, we can use the Settings class
    if (class_exists('PhpOffice\PhpWord\Settings')) {
        $upload_dir = wp_upload_dir();
        $temp_dir = $upload_dir['basedir'] . '/phpword_temp';
        if (!file_exists($temp_dir)) {
            wp_mkdir_p($temp_dir);
        }
        \PhpOffice\PhpWord\Settings::setTempDir($temp_dir);
    } else {
        // PHPWord library not found. Please ensure it is installed correctly.
    }

    // Initialize your plugin
    new WC_Customer_Thank_You_Letters();
}

class WC_Customer_Thank_You_Letters {
    private $plugin_path;
    private $settings;
    private $cookie_products = array();
    private $powder_products = array();
    private $categories_loaded = false;

    public function __construct() {
        $this->plugin_path = plugin_dir_path(__FILE__);
        $this->settings = get_option('wc_thank_you_letters_settings', array());

        add_action('admin_menu', array($this, 'add_settings_page'));
        add_action('admin_init', array($this, 'register_settings'));
        add_filter('bulk_actions-woocommerce_page_wc-orders', array($this, 'register_bulk_action'));
        add_filter('handle_bulk_actions-woocommerce_page_wc-orders', array($this, 'process_bulk_action'), 10, 3);
//        add_action('woocommerce_new_order', array($this, 'generate_letter_on_order_creation'));
    }

    public function add_settings_page() {
        add_options_page(
            'Thank You Letters Settings',
            'Thank You Letters',
            'manage_options',
            'wc-thank-you-letters',
            array($this, 'render_settings_page')
        );
    }

    public function render_settings_page() {
        ?>
        <div class="wrap">
            <h1>Thank You Letters Settings</h1>
            <form method="post" action="options.php" enctype="multipart/form-data">
                <?php
                settings_fields('wc_thank_you_letters');
                do_settings_sections('wc-thank-you-letters');
                submit_button();
                ?>
            </form>
        </div>
        <?php
    }

    public function register_settings() {
        register_setting('wc_thank_you_letters', 'wc_thank_you_letters_settings', array($this, 'sanitize_settings'));

        add_settings_section(
            'wc_thank_you_letters_section',
            'Letter Templates',
            array($this, 'section_callback'),
            'wc-thank-you-letters'
        );

		// Add new field for logo upload
        add_settings_field(
            'company_logo_thank_you_letter',
            'Company Logo',
            array($this, 'file_upload_callback'),
            'wc-thank-you-letters',
            'wc_thank_you_letters_section',
            array('field' => 'company_logo_thank_you_letter')
        );
		
        // First-time customer templates
        add_settings_field(
            'first_order_cookies_template',
            'First Order - Cookies Only Template',
            array($this, 'textarea_callback'),
            'wc-thank-you-letters',
            'wc_thank_you_letters_section',
            array('field' => 'first_order_cookies_template')
        );
        
        add_settings_field(
            'first_order_powders_template',
            'First Order - Powders Only Template',
            array($this, 'textarea_callback'),
            'wc-thank-you-letters',
            'wc_thank_you_letters_section',
            array('field' => 'first_order_powders_template')
        );
        
        add_settings_field(
            'first_order_mixed_template',
            'First Order - Cookies & Powders Template',
            array($this, 'textarea_callback'),
            'wc-thank-you-letters',
            'wc_thank_you_letters_section',
            array('field' => 'first_order_mixed_template')
        );
        
        // Returning customer templates
        add_settings_field(
            'returning_customer_cookies_template',
            'Returning Customer - Cookies Only Template',
            array($this, 'textarea_callback'),
            'wc-thank-you-letters',
            'wc_thank_you_letters_section',
            array('field' => 'returning_customer_cookies_template')
        );
        
        add_settings_field(
            'returning_customer_powders_template',
            'Returning Customer - Powders Only Template',
            array($this, 'textarea_callback'),
            'wc-thank-you-letters',
            'wc_thank_you_letters_section',
            array('field' => 'returning_customer_powders_template')
        );
        
        add_settings_field(
            'returning_customer_mixed_template',
            'Returning Customer - Cookies & Powders Template',
            array($this, 'textarea_callback'),
            'wc-thank-you-letters',
            'wc_thank_you_letters_section',
            array('field' => 'returning_customer_mixed_template')
        );
		
    }

    public function section_callback() {
        echo '<p>Customize your thank you letter templates here. Use {customer_name} as a placeholder for the customer\'s name.</p>';
    }
	
	public function file_upload_callback($args) {
        $field = $args['field'];
        $value = isset($this->settings[$field]) ? $this->settings[$field] : '';
		echo ' <span class="description">For the letter header. Max Width: 200px & Max Height: 200px</span></br>';
        echo '<input type="file" name="' . $field . '" accept="image/*" />';
        if ($value) {
            echo '<br><img src="' . esc_url($value) . '" style="max-width:200px; max-height:200px;" />';
            echo '<br><label><input type="checkbox" name="remove_logo" value="1" /> Remove logo</label>';
        }
    }
	
	
    public function sanitize_settings($input) {
        $new_input = array();

        // Sanitize all template fields
        $template_fields = array(
            'first_order_cookies_template',
            'first_order_powders_template',
            'first_order_mixed_template',
            'returning_customer_cookies_template',
            'returning_customer_powders_template',
            'returning_customer_mixed_template'
        );
        
        foreach ($template_fields as $field) {
            if (isset($input[$field])) {
                $new_input[$field] = wp_kses_post($input[$field]);
            }
        }

        // Handle logo upload
	    if (isset($_FILES['company_logo_thank_you_letter']) && $_FILES['company_logo_thank_you_letter']['error'] == 0) {
	        $allowed = array('jpg', 'jpeg', 'png', 'gif');
	        $filename = $_FILES['company_logo_thank_you_letter']['name'];
	        $ext = pathinfo($filename, PATHINFO_EXTENSION);
	        if (in_array($ext, $allowed)) {
	            require_once(ABSPATH . 'wp-admin/includes/image.php');
	            $upload = wp_handle_upload($_FILES['company_logo_thank_you_letter'], array('test_form' => false));
	            if (isset($upload['file'])) {
	                $image_editor = wp_get_image_editor($upload['file']);
	                if (!is_wp_error($image_editor)) {
	                    $image_editor->resize(200, 200, false);
	                    $image_editor->save($upload['file']);
	                }
	                $new_input['company_logo_thank_you_letter'] = $upload['url'];
	            }
	        }
	    } elseif (isset($this->settings['company_logo_thank_you_letter']) && !isset($_POST['remove_logo'])) {
	        $new_input['company_logo_thank_you_letter'] = $this->settings['company_logo_thank_you_letter'];
	    }
	
	    return $new_input;
    }	

    public function textarea_callback($args) {
        $field = $args['field'];
        $value = isset($this->settings[$field]) ? $this->settings[$field] : '';
        echo '<textarea name="wc_thank_you_letters_settings[' . $field . ']" rows="10" cols="50">' . esc_textarea($value) . '</textarea>';
    }

    public function register_bulk_action($bulk_actions) {
        $bulk_actions['bulk_download_letters'] = __('Download Letters', 'woo-customer-letters');
        return $bulk_actions;
    }

    public function process_bulk_action($redirect_to, $action, $post_ids) {

        if ($action !== 'bulk_download_letters') {
            return $redirect_to;
        }

        try {
            // Disable any output buffering
            while (ob_get_level()) {
                ob_end_clean();
            }
            
            // Set headers to prevent caching
            header('Content-Type: text/html; charset=utf-8');
            header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
            header("Cache-Control: post-check=0, pre-check=0", false);
            header("Pragma: no-cache");

            // Increase memory limit and execution time
            ini_set('memory_limit', '512M');
            set_time_limit(300); // 5 minutes

            if (empty($post_ids)) {
                wp_die('No orders selected.');
            }

            // Load product categories before processing orders
            $this->load_product_categories();
            
            $letters = $this->generate_letters_for_orders($post_ids);
            $this->download_letters_as_word($letters);
        } catch (Exception $e) {
            wp_die('Error generating letters: ' . $e->getMessage());
        }

        return $redirect_to;
    }
    
    /**
     * Load and cache product categories for cookies and powders
     */
    private function load_product_categories() {
        if ($this->categories_loaded) {
            return;
        }
        
        $this->cookie_products = array();
        $this->powder_products = array();
        
        // Get all products with cookie-fi category
        $cookie_args = array(
            'limit' => -1,
            'return' => 'ids',
            'category' => 'cookie-fi',
        );
        $this->cookie_products = wc_get_products($cookie_args);
        
        // Get all products with powder-fi category
        $powder_args = array(
            'limit' => -1,
            'return' => 'ids',
            'category' => 'powder-fi',
        );
        $this->powder_products = wc_get_products($powder_args);
        
        $this->categories_loaded = true;
    }

    private function is_first_order($customer_id, $current_order_id) {
        $order = wc_get_order($current_order_id);
        
        if ($customer_id == 0) {
            // For guest orders, check by email address instead
            $customer_email = $order->get_billing_email();
            
            if (empty($customer_email)) {
                return true;
            }
            
            $args = array(
                'billing_email' => $customer_email,
                'status'        => array('completed', 'processing'),
                'exclude'       => array($current_order_id),
                'limit'         => -1,
                'return'        => 'ids',
            );
            
            $orders = wc_get_orders($args);
            $is_first = count($orders) == 0;
            
            return $is_first;
        }

        // For registered customers, continue checking by customer ID
        $args = array(
            'customer_id' => $customer_id,
            'status'      => array('completed', 'processing'),
            'exclude'     => array($current_order_id),
            'limit'       => -1,
            'return'      => 'ids',
        );

        $orders = wc_get_orders($args);
        $is_first = count($orders) == 0;
        
        return $is_first;
    }
    
    /**
     * Determine the product types in an order
     * 
     * @param WC_Order $order
     * @return array Array with has_cookies and has_powders flags
     */
    private function get_order_product_types($order) {
        $has_cookies = false;
        $has_powders = false;
        
        // Ensure categories are loaded
        $this->load_product_categories();
        
        foreach ($order->get_items() as $item) {
            $product_id = $item->get_product_id();
            $product = wc_get_product($product_id);
            
            // Check if it's a bundle
            if ($product && $product->is_type('bundle')) {
                // Get bundled items
                $bundled_items = WC_PB_DB::query_bundled_items(array(
                    'bundle_id' => $product_id
                ));
                
                if (!empty($bundled_items)) {
                    foreach ($bundled_items as $bundled_item) {
                        $bundled_product_id = $bundled_item->product_id;
                        
                        // Check if bundled product is in cookie or powder category
                        if (in_array($bundled_product_id, $this->cookie_products)) {
                            $has_cookies = true;
                        }
                        
                        if (in_array($bundled_product_id, $this->powder_products)) {
                            $has_powders = true;
                        }
                        
                        // If we already found both types, we can stop searching
                        if ($has_cookies && $has_powders) {
                            break;
                        }
                    }
                }
            } else {
                // Simple product - check if it's in cookie or powder category
                if (in_array($product_id, $this->cookie_products)) {
                    $has_cookies = true;
                }
                
                if (in_array($product_id, $this->powder_products)) {
                    $has_powders = true;
                }
            }
            
            // If we already found both types, we can stop searching
            if ($has_cookies && $has_powders) {
                break;
            }
        }
        
        return array(
            'has_cookies' => $has_cookies,
            'has_powders' => $has_powders
        );
    }

    private function generate_letter($order, $is_first_order) {
        $customer_name = $order->get_billing_first_name();
        // Handle Finnish two-part names separated by hyphens (e.g., hanna-mari -> Hanna-Mari)
        $name_parts = explode('-', strtolower($customer_name));
        $customer_name = implode('-', array_map('ucfirst', $name_parts));
        $order_id = $order->get_id();
        
        // Determine the order product types
        $product_types = $this->get_order_product_types($order);
        $has_cookies = $product_types['has_cookies'];
        $has_powders = $product_types['has_powders'];
        
        // Select the appropriate template
        $template_key = '';
        
        if ($is_first_order) {
            if ($has_cookies && $has_powders) {
                $template_key = 'first_order_mixed_template';
            } elseif ($has_cookies) {
                $template_key = 'first_order_cookies_template';
            } elseif ($has_powders) {
                $template_key = 'first_order_powders_template';
            } else {
                // Default to mixed template if no specific product types found
                $template_key = 'first_order_mixed_template';
            }
        } else {
            if ($has_cookies && $has_powders) {
                $template_key = 'returning_customer_mixed_template';
            } elseif ($has_cookies) {
                $template_key = 'returning_customer_cookies_template';
            } elseif ($has_powders) {
                $template_key = 'returning_customer_powders_template';
            } else {
                // Default to mixed template if no specific product types found
                $template_key = 'returning_customer_mixed_template';
            }
        }
        
        $template = isset($this->settings[$template_key]) ? $this->settings[$template_key] : '';
        
        return strtr($template, [
            '{customer_name}' => $customer_name,
        ]);
    }

    private function generate_letters_for_orders($order_ids) {
        $letters = array();
        foreach ($order_ids as $order_id) {
            $order = wc_get_order($order_id);
            $letter = $order->get_meta('thank_you_letter');
            
            if (empty($letter)) {
                $is_first_order = $this->is_first_order($order->get_customer_id(), $order_id);
                $letter = $this->generate_letter($order, $is_first_order);
            }
            
            $letters[$order_id] = $letter;
        }
        
        return $letters;
    }

	private function download_letters_as_word($letters) {
	    if (!class_exists('PhpOffice\PhpWord\PhpWord')) {
	        require_once $this->plugin_path . 'vendor/autoload.php';
	    }
	    
	    $phpWord = new \PhpOffice\PhpWord\PhpWord();
	
	    $phpWord->addFontStyle('normal', array('name' => 'Arial', 'size' => 12));
	    $phpWord->addParagraphStyle('normal', array('spacing' => 120, 'spaceBefore' => 120));
	
	    $logoPath = null;
	    $logoWidth = null;
	    $logoHeight = null;
	
	    if (!empty($this->settings['company_logo_thank_you_letter'])) {
	        $logoPath = $this->get_logo_path($this->settings['company_logo_thank_you_letter']);
	        if ($logoPath && file_exists($logoPath)) {
	            list($logoWidth, $logoHeight) = getimagesize($logoPath);
	        }
	    }
	
	    // Create a header style
	    $headerStyle = array('spaceAfter' => 0);
	
	    foreach ($letters as $order_id => $letter_content) {
	        $section = $phpWord->addSection();
			
       // Add the header to every section
	        $header = $section->addHeader();
	        if ($logoPath && file_exists($logoPath)) {
	            $header->addImage(
	                $logoPath,
	                array(
	                    'width' => $logoWidth,
	                    'height' => $logoHeight,
	                    'alignment' => \PhpOffice\PhpWord\SimpleType\Jc::CENTER
	                )
	            );
	            $header->addTextBreak(1);
	        }
	        
	        $paragraphs = explode("\n", $letter_content);
	        $header->addTextBreak(2);
	        foreach ($paragraphs as $paragraph) {
	            if (!empty(trim($paragraph))) {
	                $section->addText($paragraph, 'normal', 'normal');
	            } else {
	                $section->addTextBreak();
					}
				}
			}
	
	    $objWriter = \PhpOffice\PhpWord\IOFactory::createWriter($phpWord, 'Word2007');
	    
	    $upload_dir = wp_upload_dir();
		$temp_file = $upload_dir['basedir'] . '/' . uniqid('letter_') . '.docx';
	    
		$objWriter->save($temp_file);
	
	    header("Content-Type: application/vnd.openxmlformats-officedocument.wordprocessingml.document");
	    header("Content-Disposition: attachment; filename=customer_letters.docx");
	    header("Cache-Control: max-age=0");
	    
	    readfile($temp_file);
	    
	    unlink($temp_file);
	    exit;
	}	
	
	private function get_logo_path($logo_url) {
    $upload_dir = wp_upload_dir();
    $logo_path = str_replace($upload_dir['baseurl'], $upload_dir['basedir'], $logo_url);
    return file_exists($logo_path) ? $logo_path : false;
	}
}

// Initialize the plugin
/*function run_wc_customer_thank_you_letters() {
    new WC_Customer_Thank_You_Letters();
}*/

// Check if WooCommerce is active
if (in_array('woocommerce/woocommerce.php', apply_filters('active_plugins', get_option('active_plugins')))) {
    add_action('plugins_loaded', 'initialize_wc_customer_thank_you_letters');
}

// Declare HPOS compatibility
add_action('before_woocommerce_init', function() {
    if (class_exists('\Automattic\WooCommerce\Utilities\FeaturesUtil')) {
        \Automattic\WooCommerce\Utilities\FeaturesUtil::declare_compatibility('custom_order_tables', __FILE__, true);
    }
});
