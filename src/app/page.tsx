'use client';

import { useState, useEffect, Suspense } from 'react';

// IP 验证函数
const isValidIP = (ip: string) => {
  // IPv4 验证
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (ipv4Regex.test(ip)) {
    const parts = ip.split('.');
    return parts.every(part => {
      const num = parseInt(part, 10);
      return num >= 0 && num <= 255;
    });
  }
  
  // IPv6 验证
  const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
  return ipv6Regex.test(ip);
};

// 添加国旗转换函数
const countryToFlag = (countryCode: string) => {
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
};

// 添加随机IP生成函数
const getRandomIP = () => {
  const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  const num = nums[Math.floor(Math.random() * nums.length)];
  return `${num}${num}${num}.${num}${num}${num}.${num}${num}${num}.${num}${num}${num}`;
};

export default function Home() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HomeContent />
    </Suspense>
  );
}

function HomeContent() {
  const [showMenu, setShowMenu] = useState(false);
  const [ipAddress, setIpAddress] = useState('8.8.8.8');
  const [isLoading, setIsLoading] = useState(false);
  const [isValid, setIsValid] = useState(true);
  const [queryResult, setQueryResult] = useState<any>(null);

  // 处理 URL 参数
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ipParam = params.get('ip');
    if (ipParam && isValidIP(ipParam)) {
      setIpAddress(ipParam);
    }
  }, []);

  // 验证输入的 IP
  useEffect(() => {
    if (ipAddress) {
      setIsValid(isValidIP(ipAddress));
    }
  }, [ipAddress]);

  const handleSearch = async (ip?: string) => {
    const targetIp = ip || ipAddress;
    if (!targetIp || !isValid) return;
    setIsLoading(true);
    try {
      // 获取主要数据源
      const mainResponse = await fetch(`/api/ip/${targetIp}`);
      const mainData = await mainResponse.json();
      
      // 获取额外数据源
      const extraSources = ['ipbase', 'ipdata', 'ipquery', 'ipregistry', 'ip2location_io'];
      const extraDataPromises = extraSources.map(async (source) => {
        try {
          const response = await fetch(`/api/ip/${source}/${targetIp}`);
          if (response.ok) {
            const data = await response.json();
            return { source, data };
          }
        } catch (error) {
          console.error(`${source} 查询失败:`, error);
        }
        return null;
      });

      const extraResults = await Promise.all(extraDataPromises);
      
      // 合并数据源
      const combinedSources = { ...mainData.sources };
      extraResults.forEach((result) => {
        if (result && result.data) {
          combinedSources[result.source] = result.data;
        }
      });

      setQueryResult({
        ...mainData,
        sources: combinedSources
      });
      
      // 更新 URL，但不刷新页面
      window.history.pushState({}, '', `/?ip=${targetIp}`);
    } catch (error) {
      console.error('查询失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 只在按回车时触发查询
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && isValid) {
      handleSearch();
    }
  };

  const handleShare = async () => {
    try {
      await navigator.share({
        title: document.title,
        url: window.location.href
      });
    } catch (error) {
      console.error('分享失败:', error);
    }
  };

  return (
    <main className="flex flex-col min-h-screen">
      <section className="pb-6">
        <nav className="container relative z-50 h-24 select-none">
          <div className="container relative flex flex-wrap items-center justify-between h-24 px-0 mx-auto overflow-hidden font-medium border-b border-gray-200 md:overflow-visible lg:justify-center">
            <div className="flex items-center justify-start w-1/4 h-full pr-4">
              <a href="/" className="flex items-center py-4 space-x-2 font-extrabold text-gray-900 md:py-0">
                <span className="flex items-center justify-center w-8 h-8">
                  <svg width="32" height="32" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect width="40" height="40" rx="20" fill="#18181B"/>
                    <path d="M25.4995 15.5L20.4995 27.5L14.4995 15.5L25.4995 15.5Z" fill="white" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
                <span className="mx-2 text-xl">
                  LEVELING
                  <span className="text-indigo-600">.</span>
                  ZONE
                </span>
              </a>
            </div>
            <div className={`top-0 left-0 items-start hidden w-full h-full p-4 text-sm bg-gray-900 bg-opacity-50 md:items-center md:w-3/4 md:absolute lg:text-base md:bg-transparent md:p-0 md:relative md:flex ${showMenu ? 'flex fixed' : 'hidden'}`}>
              <div className="flex-col w-full h-auto overflow-hidden bg-white rounded-lg md:bg-transparent md:overflow-visible md:rounded-none md:relative md:flex md:flex-row">
                <div className="w-full"></div>
                <div className="flex flex-col items-start justify-end w-full pt-4 md:items-center md:w-1/3 md:flex-row md:py-0">
                  <span className="w-full px-6 py-2 mr-0 text-gray-700 cursor-pointer md:px-3 md:mr-2 lg:mr-3 md:w-auto" onClick={handleShare}>Share</span>
                  <a href="https://github.com/sponsors/jasper-zsh" target="_blank" className="inline-flex items-center w-full px-5 px-6 py-3 text-sm font-medium leading-4 text-white bg-gray-900 md:w-auto md:rounded-full hover:bg-gray-800 focus:outline-none md:focus:ring-2 focus:ring-0 focus:ring-offset-2 focus:ring-gray-800">Donate</a>
                </div>
              </div>
            </div>
            <button onClick={() => setShowMenu(!showMenu)} className="absolute right-0 flex flex-col items-center items-end justify-center w-10 h-10 bg-white rounded-full cursor-pointer md:hidden hover:bg-gray-100">
              {!showMenu ? (
                <span className="w-6 h-6 icon-[mdi--dots-horizontal]"></span>
              ) : (
                <span className="w-6 h-6 icon-[mdi--window-close]"></span>
              )}
            </button>
          </div>
        </nav>
      </section>

      <section className="flex flex-1">
        <div className="container mx-auto md:w-10/12">
          <div className="flex justify-center items-center relative bg-white bg-dot-black/[0.2] mb-6 flex-col">
            <div className="absolute pointer-events-none inset-0 flex items-center justify-center bg-white [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]"></div>
            <h1 className="title text-gray-900">
              IP 位置查询
            </h1>
            <div className="pb-6 text-sm relative z-10">
              <div className="relative group">
                <a href="/myip" className="px-3 py-1 text-xs rounded-full cursor-pointer text-neutral-500 bg-neutral-100 hover:bg-neutral-200 transition-colors duration-200">
                  想要查询本机 IP ?
                </a>
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 -translate-y-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <div className="tooltip">
                    点击此链接查看本机 IP
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="container mx-auto px-4 md:px-8 lg:px-16 xl:px-32">
            <div className="input-container">
              <input
                type="text"
                placeholder={getRandomIP()}
                value={ipAddress}
                onChange={(e) => setIpAddress(e.target.value)}
                onKeyPress={handleKeyPress}
                className={!isValid && ipAddress ? 'invalid' : ''}
              />
              <button
                onClick={() => handleSearch()}
                disabled={isLoading || !isValid}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    查询中
                  </span>
                ) : (
                  '查询'
                )}
              </button>
            </div>
          </div>

          {queryResult && (
            <div className="container mx-auto px-4 md:px-8 lg:px-16 xl:px-32 mt-8">
              <div className="w-full overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left border-b border-gray-200">
                      <th className="py-3 pr-4 font-medium text-sm text-gray-500 w-[180px]">数据源</th>
                      <th className="py-3 px-4 font-medium text-sm text-gray-500 w-[140px]">IP</th>
                      <th className="py-3 px-4 font-medium text-sm text-gray-500 w-[250px]">运营商</th>
                      <th className="py-3 pl-4 font-medium text-sm text-gray-500">地址</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(queryResult.sources).map(([source, data]: [string, any]) => {
                      // 格式化数据源名称
                      const getSourceName = (source: string) => {
                        const sourceMap: { [key: string]: string } = {
                          'maxmind': '🌏 MaxMind数据库',
                          'ip2location': '🌏 IP2Location数据库',
                          'dbip': '🌏 DB-IP数据库',
                          'ipinfo': '🌏 IPinfo数据库',
                          'iptoasn': '🌏 IPtoASN数据库',
                          'asnInfo': '🌏 ASN-Info数据库',
                          'qqwry': '🇨🇳 纯真 IP数据库',
                          'geocn': '🇨🇳 GeoCN数据库',
                          'ipdata': '🌏 ipdata.co',
                          'ipbase': '🌏 ipbase.com',
                          'ipquery': '🌏 ipquery.io',
                          'ipregistry': '🌏 ipregistry.io',
                          'ip2location_io': '🌏 ip2location.io'
                        };
                        return sourceMap[source] || source;
                      };

                      // 统一 ASN 信息格式
                      let asnInfo = '';
                      if (source === 'iptoasn' && data.network) {
                        const asn = data.network.asn?.toString().replace(/^AS?/, '');
                        asnInfo = `AS${asn} | ${data.network.organization || '-'}`;
                      } else if (source === 'asnInfo' && data.network) {
                        const asn = data.network.asn?.toString().replace(/^AS?/, '');
                        asnInfo = `AS${asn} | ${data.network.handle}${data.network.description ? ` (${data.network.description})` : ''}`;
                      } else if (source === 'ipdata' && data.asn) {
                        const asn = data.asn.asn?.toString().replace(/^AS?/, '');
                        asnInfo = `AS${asn} | ${data.asn.name}${data.asn.domain ? ` (${data.asn.domain})` : ''}`;
                      } else if (source === 'ipbase' && data.data?.connection) {
                        const conn = data.data.connection;
                        asnInfo = `AS${conn.asn} | ${conn.organization}${conn.isp && conn.isp !== conn.organization ? ` (${conn.isp})` : ''}`;
                      } else if (source === 'ipregistry' && data.connection) {
                        asnInfo = `AS${data.connection.asn} | ${data.connection.organization}${data.connection.domain ? ` (${data.connection.domain})` : ''}`;
                      } else if (source === 'ipquery' && data.isp) {
                        asnInfo = `AS${data.isp.asn?.replace(/^AS/, '')} | ${data.isp.org}${data.isp.isp && data.isp.isp !== data.isp.org ? ` (${data.isp.isp})` : ''}`;
                      } else if (data.network?.asn) {
                        const asn = data.network.asn.toString().replace(/^AS?/, '');
                        let org = '';
                        if (data.network.organization) {
                          org = data.network.organization;
                        } else if (data.meta?.organization?.name) {
                          org = data.meta.organization.name;
                        } else if (data.network.name) {
                          org = data.network.name;
                        }
                        asnInfo = `AS${asn} | ${org || '-'}`;
                      } else if (data.network?.isp) {
                        asnInfo = data.network.isp;
                      } else if (source === 'ip2location_io' && data.network) {
                        const asn = data.network.asn?.toString().replace(/^AS?/, '');
                        asnInfo = `AS${asn} | ${data.network.organization}${data.network.isp !== data.network.organization ? ` (${data.network.isp})` : ''}`;
                      }

                      // 获取地理位置信息并添加国旗
                      let location = '-';
                      if (source === 'ipdata') {
                        const parts = [
                          data.country_name,
                          data.region,
                          data.city
                        ].filter(Boolean);
                        const flag = data.country_code ? countryToFlag(data.country_code) : '';
                        location = parts.length > 0 ? `${flag} ${parts.join(' • ')}` : '-';
                      } else if (source === 'ipbase' && data.data?.location) {
                        const loc = data.data.location;
                        const parts = [
                          loc.country?.name,
                          loc.region?.name,
                          loc.city?.name
                        ].filter(Boolean);
                        const flag = loc.country?.alpha2 ? countryToFlag(loc.country.alpha2) : '';
                        location = parts.length > 0 ? `${flag} ${parts.join(' • ')}` : '-';
                      } else if (source === 'ipregistry') {
                        const parts = [
                          data.location.country?.name,
                          data.location.region?.name,
                          data.location.city
                        ].filter(Boolean);
                        const flag = data.location.country?.code ? countryToFlag(data.location.country.code) : '';
                        location = parts.length > 0 ? `${flag} ${parts.join(' • ')}` : '-';
                      } else if (source === 'ipquery' && data.location) {
                        const parts = [
                          data.location.country,
                          data.location.state,
                          data.location.city
                        ].filter(Boolean);
                        const flag = data.location.country_code ? countryToFlag(data.location.country_code) : '';
                        location = parts.length > 0 ? `${flag} ${parts.join(' • ')}` : '-';
                      } else if (data.location) {
                        const countryCode = data.location.countryCode || data.location.country_code || '';
                        const flag = countryCode ? countryToFlag(countryCode) : '';
                        
                        // 处理中国特有的地址格式
                        if (source === 'geocn' || source === 'qqwry') {
                          const parts = [
                            data.location.country,
                            data.location.province || data.location.region,
                            data.location.city,
                            data.location.district
                          ].filter(Boolean);
                          location = parts.join(' • ') || '-';
                        } else {
                          const parts = [
                            data.location.country,
                            data.location.region,
                            data.location.city
                          ].filter(Boolean);
                          location = parts.length > 0 ? `${flag} ${parts.join(' • ')}` : '-';
                        }
                      } else if (source === 'ip2location_io' && data.location) {
                        const parts = [
                          data.location.country,
                          data.location.region,
                          data.location.city,
                          data.location.district
                        ].filter(Boolean);
                        const flag = data.location.countryCode ? countryToFlag(data.location.countryCode) : '';
                        location = parts.length > 0 ? `${flag} ${parts.join(' • ')}` : '-';
                      }

                      return (
                        <tr key={source} className="border-t border-gray-200 hover:bg-gray-50">
                          <td className="py-3 pr-4 text-sm text-gray-500">{getSourceName(source)}</td>
                          <td className="py-3 px-4 text-sm">
                            <span className="px-2 py-0.5 text-xs rounded-full bg-neutral-100 text-neutral-500">
                              {ipAddress}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-900">{asnInfo || '-'}</td>
                          <td className="py-3 pl-4 text-sm text-gray-900">{location || '-'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="text-gray-700 md:pt-6">
        <div className="footer-container">
          <div className="flex flex-col items-center sm:items-start py-1">
            <a href="/" className="text-xl font-black leading-none text-gray-900 select-none logo">
              HTML
              <span className="text-indigo-600">.</span>
              ZONE
            </a>
            <a className="mt-4 text-sm text-gray-500 block" href="https://html.zone" target="_blank">
              &copy; 2025 Web is Cool, Web is Best.
            </a>
          </div>
          <div className="flex-1 sm:px-2 md:px-10 lg:px-20 xl:px-36 text-center sm:text-left">
            <div className="text-lg font-bold text-gray-900 mb-4 hidden sm:block">Products</div>
            <div className="grid grid-cols-2 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-1">
              <a href="https://tempmail.best" className="footer-link">TempMail.Best</a>
              <a href="https://sink.cool" className="footer-link">Sink.Cool</a>
              <a href="https://dns.surf" className="footer-link">DNS.Surf</a>
              <a href="https://loooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooo.ong" className="footer-link">L(O*62).ONG</a>
              <a href="https://beauty.codes" className="footer-link">Beauty.Codes</a>
              <a href="https://awesome-homelab.com" className="footer-link">Awesome Homelab</a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
