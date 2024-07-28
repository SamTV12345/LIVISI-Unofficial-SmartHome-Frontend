import React from 'react';
import Chart from 'react-apexcharts';
import {ApexOptions} from "apexcharts";

export type DataPoint = {
    timeString: string;
    value: number;

};

type TimeSeriesChartProps = {
    data: DataPoint[];
    ytitle: string;
    chartTitle: string;
};

const TimeSeriesChart: React.FC<TimeSeriesChartProps> = ({ data, chartTitle,ytitle }) => {
    const series = [
        {
            name: 'Value',
            data: data.map(point => [new Date(point.timeString).getTime(), point.value]),
            type: 'area', // Set the series type to 'area'
        },
    ];

    const options: ApexOptions = {
        chart: {
            type: 'area',
            zoom: {
                enabled: false,
            },
            toolbar:{
                show: false
            }
        },
        xaxis: {
            type: 'datetime',
        },
        yaxis: {
            title: {
                text: ytitle,
            },
        },
        title: {
            text: chartTitle,
            align: 'left',
        },
        fill: {
            type: 'solid',
            colors: ['#88ba14'], // Set the fill color to #88ba14
        },
        stroke: {
            curve: 'smooth',
            colors: ['#88ba14'], // Set the line color to #88ba14
        },
    };

    return <Chart options={options} series={series} type="line" height={350} />;
};

export default TimeSeriesChart;
