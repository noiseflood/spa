import { GetServerSideProps } from 'next';
import fs from 'fs';
import path from 'path';

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  // Read the schema file from your repo
  const schemaPath = path.join(process.cwd(), '../schema/spa-v1.0.schema.json');
  const schema = fs.readFileSync(schemaPath, 'utf-8');
  
  res.setHeader('Content-Type', 'application/json');
  res.write(schema);
  res.end();
  
  return { props: {} };
};

export default function Schema() {
  return null;
}