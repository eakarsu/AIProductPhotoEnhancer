import React from 'react';

const scenarios = [
  { label: 'Studio product', description: 'Example brief: photograph PRODUCT on a white studio sweep with soft side light, sharp focus, and accurate color.', audience: 'Young professionals', style: 'Modern minimalist' },
  { label: 'Outdoor lifestyle', description: 'Example brief: photograph PRODUCT in a natural outdoor setting with warm afternoon light and a softly blurred background.', audience: 'Outdoor adventurers', style: 'Adventure' },
  { label: 'Catalog detail', description: 'Example brief: photograph PRODUCT on a neutral backdrop with even diffused light and clear views of its material and details.', audience: 'Fashion lovers', style: 'Classic elegance' },
];

export function nativePreset(page, current, products, index) {
  const sample = scenarios[index];
  const selected = products.some((product) => String(product.id) === String(current.product_id))
    ? current.product_id : (products[0]?.id ?? '');
  const product = products.find((item) => String(item.id) === String(selected));
  const description = sample.description.replace('PRODUCT', product?.name || 'the selected product');
  const next = { ...current, product_id: selected };
  if ('image_description' in next) next.image_description = description;
  if ('product_description' in next) next.product_description = description;
  if ('enhancement_type' in next) next.enhancement_type = ['auto_enhance', 'color_correction', 'sharpening'][index];
  if ('target_audience' in next) next.target_audience = sample.audience;
  if ('style' in next) next.style = sample.style;
  if ('reference_object' in next) next.reference_object = ['Standard credit card (85.6 mm wide)', 'Adult hand for scale', 'Smartphone (approx. 15 cm tall)'][index];
  if ('frame_count' in next) next.frame_count = [36, 24, 48][index];
  if ('rotation_speed' in next) next.rotation_speed = [24, 30, 20][index];
  if ('customer_measurements' in next) next.customer_measurements = [
    { chest: '38', waist: '32', hips: '40', height: '68' },
    { chest: '42', waist: '36', hips: '43', height: '72' },
    { chest: '35', waist: '29', hips: '38', height: '65' },
  ][index];
  if ('customer_history' in next) next.customer_history = [
    { previous_orders: '12', return_rate: '8', account_age: '24', reviews_given: '4' },
    { previous_orders: '3', return_rate: '0', account_age: '6', reviews_given: '1' },
    { previous_orders: '28', return_rate: '18', account_age: '48', reviews_given: '11' },
  ][index];
  if ('occasion' in next) next.occasion = ['Birthday', 'Housewarming', 'Anniversary'][index];
  if ('budget_range' in next) next.budget_range = ['$25-$50', '$50-$100', '$100-$200'][index];
  if ('recipient_profile' in next) next.recipient_profile = [
    { age: '30', gender: 'female', interests: 'Coffee, home design, ceramics' },
    { age: '42', gender: 'male', interests: 'Hiking, travel, reusable gear' },
    { age: '35', gender: 'non-binary', interests: 'Fashion, craft, everyday accessories' },
  ][index];
  return next;
}

export default function NativeAIPresets({ page, value, onChange, products }) {
  return <div className="space-y-2"><div className="flex flex-wrap gap-2">{scenarios.map((sample, index) =>
    <button key={sample.label} type="button" onClick={() => onChange(nativePreset(page, value, products, index))}
      className="px-3 py-2 bg-slate-700/50 border border-dashed border-slate-500 text-slate-200 rounded-lg hover:bg-slate-700 text-sm">{sample.label}</button>
  )}</div><p className="text-xs text-slate-400">Examples fill every field. Review before generating.{!products.length && ' Select or create a real product first.'}</p></div>;
}
