import ProductsClient from "@/components/shop/ProductsClient";

export default async function ProductsPage({ searchParams }) {
  const params = await searchParams;
  const requestedPage = Number(params?.page);
  const initialPage = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;

  return <ProductsClient initialPage={initialPage} />;
}
