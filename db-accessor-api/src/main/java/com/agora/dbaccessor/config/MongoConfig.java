package com.agora.dbaccessor.config;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.convert.converter.Converter;
import org.springframework.data.mongodb.core.convert.MongoCustomConversions;

@Configuration
public class MongoConfig {

    static class OffsetDateTimeToStringConverter implements Converter<OffsetDateTime, String> {
        @Override
        public String convert(OffsetDateTime source) {
            return source == null ? null : source.toString();
        }
    }

    static class StringToOffsetDateTimeConverter implements Converter<String, OffsetDateTime> {
        @Override
        public OffsetDateTime convert(String source) {
            return source == null ? null : OffsetDateTime.parse(source);
        }
    }

    @Bean
    public MongoCustomConversions mongoCustomConversions() {
        List<Converter<?, ?>> converters = new ArrayList<>();
        converters.add(new OffsetDateTimeToStringConverter());
        converters.add(new StringToOffsetDateTimeConverter());
        return new MongoCustomConversions(converters);
    }
}
