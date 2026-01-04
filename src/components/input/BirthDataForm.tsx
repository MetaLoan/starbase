'use client';

import React, { useState } from 'react';
import { 
  Card, 
  CardBody, 
  CardHeader, 
  Input, 
  Button, 
  Select, 
  SelectItem,
  Divider 
} from '@heroui/react';
import { type BirthData } from '@/lib/astro';

interface BirthDataFormProps {
  onSubmit: (data: BirthData) => void;
  initialData?: Partial<BirthData>;
  isLoading?: boolean;
}

// 常用城市坐标
const CITIES = [
  { name: '北京', lat: 39.9042, lng: 116.4074, tz: 'Asia/Shanghai' },
  { name: '上海', lat: 31.2304, lng: 121.4737, tz: 'Asia/Shanghai' },
  { name: '广州', lat: 23.1291, lng: 113.2644, tz: 'Asia/Shanghai' },
  { name: '深圳', lat: 22.5431, lng: 114.0579, tz: 'Asia/Shanghai' },
  { name: '香港', lat: 22.3193, lng: 114.1694, tz: 'Asia/Hong_Kong' },
  { name: '台北', lat: 25.0330, lng: 121.5654, tz: 'Asia/Taipei' },
  { name: '东京', lat: 35.6762, lng: 139.6503, tz: 'Asia/Tokyo' },
  { name: '纽约', lat: 40.7128, lng: -74.0060, tz: 'America/New_York' },
  { name: '伦敦', lat: 51.5074, lng: -0.1278, tz: 'Europe/London' },
  { name: '巴黎', lat: 48.8566, lng: 2.3522, tz: 'Europe/Paris' },
  { name: '悉尼', lat: -33.8688, lng: 151.2093, tz: 'Australia/Sydney' },
  { name: '新加坡', lat: 1.3521, lng: 103.8198, tz: 'Asia/Singapore' },
];

export function BirthDataForm({ onSubmit, initialData, isLoading }: BirthDataFormProps) {
  const [date, setDate] = useState(initialData?.date ? 
    new Date(initialData.date).toISOString().split('T')[0] : '1990-01-01');
  const [time, setTime] = useState('12:00');
  const [selectedCity, setSelectedCity] = useState<string>('北京');
  const [customLat, setCustomLat] = useState('');
  const [customLng, setCustomLng] = useState('');
  const [useCustomLocation, setUseCustomLocation] = useState(false);
  const [name, setName] = useState(initialData?.name || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const city = CITIES.find(c => c.name === selectedCity);
    const latitude = useCustomLocation ? parseFloat(customLat) : (city?.lat || 39.9042);
    const longitude = useCustomLocation ? parseFloat(customLng) : (city?.lng || 116.4074);
    const timezone = city?.tz || 'Asia/Shanghai';

    const [year, month, day] = date.split('-').map(Number);
    const [hour, minute] = time.split(':').map(Number);
    
    const birthDate = new Date(year, month - 1, day, hour, minute);

    onSubmit({
      date: birthDate,
      latitude,
      longitude,
      timezone,
      name: name || undefined,
    });
  };

  return (
    <Card className="glass-card w-full max-w-md">
      <CardHeader className="flex flex-col items-start gap-1">
        <h2 className="text-xl font-display text-cosmic-nova">出生信息</h2>
        <p className="text-sm text-default-400">输入您的出生数据以计算星盘</p>
      </CardHeader>
      <CardBody>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 姓名 */}
          <Input
            label="姓名（可选）"
            placeholder="输入姓名"
            value={name}
            onValueChange={setName}
            variant="bordered"
            classNames={{
              input: 'font-body',
              label: 'text-default-400',
            }}
          />

          <Divider className="my-2" />

          {/* 日期 */}
          <Input
            type="date"
            label="出生日期"
            value={date}
            onValueChange={setDate}
            variant="bordered"
            isRequired
            classNames={{
              input: 'font-mono',
              label: 'text-default-400',
            }}
          />

          {/* 时间 */}
          <Input
            type="time"
            label="出生时间"
            value={time}
            onValueChange={setTime}
            variant="bordered"
            isRequired
            description="时间越精确，宫位计算越准确"
            classNames={{
              input: 'font-mono',
              label: 'text-default-400',
            }}
          />

          <Divider className="my-2" />

          {/* 城市选择 */}
          <Select
            label="出生城市"
            placeholder="选择城市"
            selectedKeys={[selectedCity]}
            onSelectionChange={(keys) => {
              const key = Array.from(keys)[0] as string;
              if (key) {
                setSelectedCity(key);
                setUseCustomLocation(false);
              }
            }}
            variant="bordered"
            classNames={{
              label: 'text-default-400',
            }}
          >
            {CITIES.map((city) => (
              <SelectItem key={city.name}>
                {city.name}
              </SelectItem>
            ))}
          </Select>

          {/* 自定义坐标 */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="text-xs text-default-400 hover:text-primary transition-colors"
              onClick={() => setUseCustomLocation(!useCustomLocation)}
            >
              {useCustomLocation ? '使用城市' : '使用自定义坐标'}
            </button>
          </div>

          {useCustomLocation && (
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="number"
                label="纬度"
                placeholder="39.9042"
                value={customLat}
                onValueChange={setCustomLat}
                variant="bordered"
                size="sm"
                step="0.0001"
                classNames={{
                  input: 'font-mono text-sm',
                  label: 'text-default-400',
                }}
              />
              <Input
                type="number"
                label="经度"
                placeholder="116.4074"
                value={customLng}
                onValueChange={setCustomLng}
                variant="bordered"
                size="sm"
                step="0.0001"
                classNames={{
                  input: 'font-mono text-sm',
                  label: 'text-default-400',
                }}
              />
            </div>
          )}

          <Button
            type="submit"
            color="primary"
            className="w-full font-display"
            size="lg"
            isLoading={isLoading}
          >
            计算星盘
          </Button>
        </form>
      </CardBody>
    </Card>
  );
}

