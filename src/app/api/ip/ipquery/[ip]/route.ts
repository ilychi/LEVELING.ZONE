import { NextRequest, NextResponse } from 'next/server';

async function getIpQueryInfo(ip: string) {
  try {
    const timestamp = Date.now();
    const response = await fetch(`https://api.ipquery.io/${ip}?format=json&_t=${timestamp}`);
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error('IpQuery查询失败:', error);
    return null;
  }
}

export async function GET(request: NextRequest, { params }: { params: { ip: string } }) {
  try {
    const ip = params.ip;
    if (!ip) {
      return NextResponse.json(
        { error: 'IP parameter is required' },
        {
          status: 400,
          headers: { 'Content-Type': 'application/json; charset=utf-8' },
        }
      );
    }

    const data = await getIpQueryInfo(ip);
    if (!data) {
      return NextResponse.json(
        { error: 'Failed to fetch data' },
        {
          status: 404,
          headers: { 'Content-Type': 'application/json; charset=utf-8' },
        }
      );
    }

    return new NextResponse(JSON.stringify(data, null, 2), {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
    });
  } catch (error) {
    console.error('查询失败:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      {
        status: 500,
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
      }
    );
  }
}
